import os
import pandas as pd
import numpy as np
from datetime import datetime
import json
from sqlalchemy.orm import Session
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from statsmodels.tsa.holtwinters import ExponentialSmoothing
from statsmodels.tsa.arima.model import ARIMA

from celery import Celery
from ..config import settings
from ..models import Dataset, CleanedDataset, SalesRecord, AnalyticsResult, CustomerSegment, Prediction, Recommendation
from ..database import SessionLocal

celery = Celery("tasks", broker=settings.REDIS_URL, backend=settings.REDIS_URL)

def safe_qcut(series: pd.Series, num_bins: int, labels: list) -> pd.Series:
    """
    Safely executes qcut, handling duplicate bin edges and small series sizes.
    """
    n_unique = series.nunique()
    n_total = len(series)
    
    if n_total == 0:
        return pd.Series([], dtype=int)
        
    if n_unique <= 1:
        middle_idx = len(labels) // 2
        return pd.Series([labels[middle_idx]] * n_total, index=series.index)
        
    # If the series has fewer elements than requested bins, scale the labels
    if n_total < num_bins:
        sorted_vals = sorted(series.unique())
        val_to_score = {}
        for i, val in enumerate(sorted_vals):
            lbl_idx = int((i / max(1, len(sorted_vals) - 1)) * (len(labels) - 1))
            val_to_score[val] = labels[lbl_idx]
        return series.map(val_to_score)

    try:
        return pd.qcut(series, num_bins, labels=labels, duplicates="drop")
    except ValueError:
        try:
            # Fallback to rank-based qcut to break ties
            ranks = series.rank(method="first")
            return pd.qcut(ranks, num_bins, labels=labels)
        except Exception:
            middle_idx = len(labels) // 2
            return pd.Series([labels[middle_idx]] * n_total, index=series.index)

def smart_detect_schema(df: pd.DataFrame) -> dict:
    """
    Fuzzy matches column names to standard keys.
    Returns a mapping dict: {original_col: standard_key}
    """
    columns = df.columns.tolist()
    mappings = {}
    
    keywords = {
        "customer_id": ["cust id", "customer id", "customer_id", "cust_id", "client id", "client_id"],
        "customer_name": ["cust name", "customer name", "customer_name", "cust_name", "client name", "client_name", "customer", "client"],
        "product_id": ["prod id", "product id", "product_id", "prod_id", "item id", "item_id"],
        "product_name": ["prod name", "product name", "product_name", "prod_name", "item name", "item_name", "product", "item"],
        "product_category": ["category", "prod category", "product category", "product_category", "prod_category", "dept", "department"],
        "sales_amount": ["sales", "sales amount", "sales_amount", "amount", "revenue", "price", "subtotal", "total", "sale price"],
        "profit": ["profit", "margin", "earnings", "net profit"],
        "quantity": ["quantity", "qty", "count", "units", "items_count"],
        "order_date": ["order date", "order_date", "date", "txn date", "transaction date", "signup date", "signup_date"],
        "country": ["country", "nation"],
        "state": ["state", "province", "territory"],
        "city": ["city", "town"],
        "region": ["region", "zone", "area"]
    }
    
    for col in columns:
        col_lower = str(col).lower().strip()
        matched = False
        
        # Exact matching
        for standard_key, list_of_aliases in keywords.items():
            if col_lower in list_of_aliases:
                # Exclude salesperson/rep/manager/etc from sales_amount
                if standard_key == "sales_amount" and any(x in col_lower for x in ["person", "rep", "manager", "agent", "name", "id", "by"]):
                    continue
                mappings[col] = standard_key
                matched = True
                break
        
        # Fallback substring matching
        if not matched:
            for standard_key, list_of_aliases in keywords.items():
                for alias in list_of_aliases:
                    if alias in col_lower and len(alias) > 3:
                        # Exclude salesperson/rep/manager/etc from sales_amount
                        if standard_key == "sales_amount" and any(x in col_lower for x in ["person", "rep", "manager", "agent", "name", "id", "by"]):
                            continue
                        mappings[col] = standard_key
                        matched = True
                        break
                if matched:
                    break
                    
    return mappings

def clean_dataset_df(df: pd.DataFrame, mapping: dict) -> tuple[pd.DataFrame, dict]:
    """
    Renames columns, handles duplicates/missing values, standardizes types, and flags outliers.
    """
    clean_df = df.copy()
    
    # Rename columns based on mapping
    clean_df = clean_df.rename(columns={k: v for k, v in mapping.items()})
    
    # Deduplicate column names to avoid duplicate standard keys (keep the first one)
    clean_df = clean_df.loc[:, ~clean_df.columns.duplicated()]
    
    # Track statistics
    summary = {
        "initial_rows": len(df),
        "duplicates_removed": 0,
        "missing_values_filled": {},
        "outliers_detected": 0,
        "records_processed": 0
    }
    
    # 1. Duplicates
    dup_count = clean_df.duplicated().sum()
    if dup_count > 0:
        clean_df = clean_df.drop_duplicates()
        summary["duplicates_removed"] = int(dup_count)
        
    # 2. Standardize types of existing columns first (safely stripping string formatting)
    if "sales_amount" in clean_df.columns:
        if clean_df["sales_amount"].dtype == object:
            clean_df["sales_amount"] = clean_df["sales_amount"].astype(str).str.replace(",", "", regex=False).str.replace("$", "", regex=False).str.strip()
        clean_df["sales_amount"] = pd.to_numeric(clean_df["sales_amount"], errors="coerce").fillna(0.0).astype(float)
    if "profit" in clean_df.columns:
        if clean_df["profit"].dtype == object:
            clean_df["profit"] = clean_df["profit"].astype(str).str.replace(",", "", regex=False).str.replace("$", "", regex=False).str.strip()
        clean_df["profit"] = pd.to_numeric(clean_df["profit"], errors="coerce").fillna(0.0).astype(float)
    if "quantity" in clean_df.columns:
        clean_df["quantity"] = pd.to_numeric(clean_df["quantity"], errors="coerce").fillna(1).astype(int)
    if "order_date" in clean_df.columns:
        try:
            clean_df["order_date"] = pd.to_datetime(clean_df["order_date"], errors="coerce")
        except Exception:
            pass

    # 3. Add standard columns as fallbacks if missing completely
    fallbacks = {
        "sales_amount": 0.0,
        "profit": None, # custom calc based on 0.3 * sales_amount
        "quantity": 1,
        "order_date": None,
        "customer_id": "C-Unknown",
        "customer_name": "Unknown Customer",
        "product_id": "P-Unknown",
        "product_name": "Unknown Product",
        "product_category": "Uncategorized",
        "region": "Unknown Region",
        "country": "Unknown Country",
        "state": "Unknown State",
        "city": "Unknown City"
    }
    
    for col, val in fallbacks.items():
        if col not in clean_df.columns:
            if col == "profit":
                clean_df[col] = clean_df["sales_amount"] * 0.3 if "sales_amount" in clean_df.columns else 0.0
            elif col == "order_date":
                clean_df[col] = datetime.utcnow().strftime("%Y-%m-%d")
            else:
                clean_df[col] = val
                
    # 4. Fill missing values
    for col in clean_df.columns:
        null_count = clean_df[col].isnull().sum()
        if isinstance(null_count, (pd.Series, np.ndarray)):
            null_count = null_count.sum()
        if int(null_count) > 0:
            summary["missing_values_filled"][col] = int(null_count)
            if col in ["sales_amount", "profit"]:
                clean_df[col] = clean_df[col].fillna(0.0)
            elif col == "quantity":
                clean_df[col] = clean_df[col].fillna(1)
            elif col == "order_date":
                clean_df[col] = clean_df[col].fillna(datetime.utcnow().strftime("%Y-%m-%d"))
            elif col in ["customer_id", "customer_name", "product_id", "product_name", "product_category", "region", "country", "state", "city"]:
                clean_df[col] = clean_df[col].fillna("Unknown")
            else:
                clean_df[col] = clean_df[col].fillna("Unknown")
                
    # 5. Standardize dates
    try:
        clean_df["order_date"] = pd.to_datetime(clean_df["order_date"], errors="coerce")
        # Fill failed parses
        clean_df["order_date"] = clean_df["order_date"].fillna(pd.Timestamp.now())
    except Exception:
        clean_df["order_date"] = pd.Timestamp.now()
        
    # 6. Standardize types finally
    clean_df["sales_amount"] = pd.to_numeric(clean_df["sales_amount"], errors="coerce").fillna(0.0).astype(float)
    clean_df["profit"] = pd.to_numeric(clean_df["profit"], errors="coerce").fillna(0.0).astype(float)
    clean_df["quantity"] = pd.to_numeric(clean_df["quantity"], errors="coerce").fillna(1).astype(int)
        
    # 7. Outlier detection on sales_amount (Z-score > 3)
    if len(clean_df) > 5:
        mean_sales = clean_df["sales_amount"].mean()
        std_sales = clean_df["sales_amount"].std()
        if std_sales > 0:
            z_scores = (clean_df["sales_amount"] - mean_sales) / std_sales
            outliers = (z_scores.abs() > 3).sum()
            summary["outliers_detected"] = int(outliers)
            
    summary["records_processed"] = len(clean_df)
    
    return clean_df, summary


def calculate_kpis(df: pd.DataFrame) -> dict:
    """Calculates high-level business KPIs and monthly trends."""
    total_rev = float(df["sales_amount"].sum())
    total_prof = float(df["profit"].sum())
    total_ord = len(df)
    
    cust_col = "customer_id"
    total_cust = df[cust_col].nunique()
    
    avg_order_value = total_rev / total_ord if total_ord > 0 else 0.0
    clv = total_rev / total_cust if total_cust > 0 else 0.0
    
    purchase_counts = df[cust_col].value_counts()
    retained = (purchase_counts > 1).sum()
    retention_rate = float((retained / total_cust) * 100) if total_cust > 0 else 0.0
    churn_rate = max(0.0, 100.0 - retention_rate)
    
    # Calculate historical monthly trend
    monthly_trend = []
    try:
        df_sorted = df.sort_values("order_date")
        df_sorted["month_period"] = df_sorted["order_date"].dt.to_period("M")
        monthly_grouped = df_sorted.groupby("month_period").agg(
            revenue=("sales_amount", "sum"),
            profit=("profit", "sum"),
            orders=("sales_amount", "count"),
            customers=("customer_id", "nunique")
        )
        for period, row in monthly_grouped.iterrows():
            monthly_trend.append({
                "date": str(period),
                "revenue": round(float(row["revenue"]), 2),
                "profit": round(float(row["profit"]), 2),
                "orders": int(row["orders"]),
                "customers": int(row["customers"])
            })
    except Exception as e:
        print(f"Error calculating monthly trend: {e}")
        
    return {
        "total_revenue": round(total_rev, 2),
        "total_profit": round(total_prof, 2),
        "total_orders": total_ord,
        "total_customers": total_cust,
        "average_order_value": round(avg_order_value, 2),
        "customer_lifetime_value": round(clv, 2),
        "retention_rate": round(retention_rate, 2),
        "churn_rate": round(churn_rate, 2),
        "monthly_trend": monthly_trend
    }

def run_rfm_segmentation(df: pd.DataFrame) -> pd.DataFrame:
    """
    Computes RFM Scores and assigns segmentation labels.
    """
    cust_col = "customer_id"
    reference_date = df["order_date"].max() + pd.Timedelta(days=1)
    
    rfm = df.groupby(cust_col).agg({
        "order_date": lambda x: (reference_date - x.max()).days,
        "sales_amount": ["count", "sum"]
    })
    
    rfm.columns = ["recency", "frequency", "monetary"]
    rfm = rfm.reset_index()
    
    # Quantiles for scoring 1 to 5 (higher is better)
    rfm["R"] = safe_qcut(rfm["recency"], 5, [5, 4, 3, 2, 1])
    rfm["F"] = safe_qcut(rfm["frequency"], 5, [1, 2, 3, 4, 5])
    rfm["M"] = safe_qcut(rfm["monetary"], 5, [1, 2, 3, 4, 5])
    
    # Handle low variety edge-cases (ensure they are integers)
    rfm["R"] = rfm["R"].astype(int)
    rfm["F"] = rfm["F"].astype(int)
    rfm["M"] = rfm["M"].astype(int)
    
    # Segment Assignment Rules
    def assign_segment(r):
        score = r["R"] + r["F"] + r["M"]
        if score >= 13:
            return "Champions"
        elif score >= 10:
            return "Loyal Customers"
        elif score >= 7:
            return "Potential Loyalists"
        elif score >= 5:
            return "New Customers"
        elif score >= 3:
            return "At Risk"
        else:
            return "Lost Customers"
            
    rfm["segment_name"] = rfm.apply(assign_segment, axis=1)
    
    # Add customer_name back if available in the main dataframe
    if "customer_name" in df.columns:
        cust_name_map = df.drop_duplicates(subset=[cust_col]).set_index(cust_col)["customer_name"].to_dict()
        rfm["customer_name"] = rfm[cust_col].map(cust_name_map)
    else:
        rfm["customer_name"] = rfm[cust_col]
    
    # K-Means Clustering on RFM fields
    try:
        if len(rfm) >= 4:
            scaler = StandardScaler()
            scaled_rfm = scaler.fit_transform(rfm[["recency", "frequency", "monetary"]])
            kmeans = KMeans(n_clusters=min(4, len(rfm)), random_state=42, n_init=10)
            rfm["cluster_id"] = kmeans.fit_predict(scaled_rfm)
        else:
            rfm["cluster_id"] = 0
    except Exception:
        rfm["cluster_id"] = 0
        
    return rfm

def run_forecasting(df: pd.DataFrame) -> list[dict]:
    """
    Performs monthly Sales Forecasting using Holt-Winters, ARIMA, and Random Forest.
    Averages predictions to generate a hybrid robust forecast for the next 6 months.
    """
    df_sorted = df.sort_values("order_date")
    monthly_sales = df_sorted.set_index("order_date").resample("ME")["sales_amount"].sum()
    
    # We need at least 6 months of historical data to generate standard forecasts.
    # Fallback to simple trend line if insufficient historical data.
    if len(monthly_sales) < 6:
        # Fallback generator
        last_val = monthly_sales.iloc[-1] if len(monthly_sales) > 0 else 1000.0
        dates = pd.date_range(start=datetime.now(), periods=6, freq="ME")
        forecasts = []
        for i, dt in enumerate(dates):
            growth = 1.0 + (i + 1) * 0.02
            val = round(last_val * growth, 2)
            forecasts.append({
                "date": dt.strftime("%Y-%m-%d"),
                "value": val,
                "confidence_upper": round(val * 1.15, 2),
                "confidence_lower": round(val * 0.85, 2)
            })
        return forecasts
        
    # Fit models
    history = monthly_sales.values
    horizon = 6
    
    # 1. Holt-Winters
    try:
        hw_model = ExponentialSmoothing(history, seasonal_periods=3, trend="add", seasonal="add").fit()
        hw_pred = hw_model.forecast(horizon)
    except Exception:
        hw_pred = np.linspace(history[-1], history[-1] * 1.1, horizon)
        
    # 2. ARIMA
    try:
        arima_model = ARIMA(history, order=(1, 1, 0)).fit()
        arima_pred = arima_model.forecast(steps=horizon)
    except Exception:
        arima_pred = np.linspace(history[-1], history[-1] * 1.08, horizon)
        
    # 3. Random Forest (Lag-based)
    try:
        lags_df = pd.DataFrame({"y": history})
        lags_df["lag1"] = lags_df["y"].shift(1)
        lags_df["lag2"] = lags_df["y"].shift(2)
        lags_df.dropna(inplace=True)
        
        X = lags_df[["lag1", "lag2"]].values
        y = lags_df["y"].values
        
        rf = RandomForestRegressor(n_estimators=50, random_state=42)
        rf.fit(X, y)
        
        # Roll forward forecast
        rf_pred = []
        last_lags = [history[-1], history[-2]]
        for _ in range(horizon):
            pred = rf.predict([last_lags])[0]
            rf_pred.append(pred)
            last_lags = [pred, last_lags[0]]
    except Exception:
        rf_pred = np.linspace(history[-1], history[-1] * 1.05, horizon)
        
    # Combine predictions using weighted average (ARIMA: 30%, Holt-Winters: 40%, Random Forest: 30%)
    hybrid_preds = []
    last_dt = monthly_sales.index[-1]
    
    for i in range(horizon):
        val = (hw_pred[i] * 0.40) + (arima_pred[i] * 0.30) + (rf_pred[i] * 0.30)
        val = max(0.0, float(val))
        
        # Date step
        future_dt = last_dt + pd.DateOffset(months=i+1)
        
        # Standard deviation estimator for confidence bounds (increasing uncertainty over horizon)
        std_est = history.std() * 0.15 * (i + 1) ** 0.5
        
        hybrid_preds.append({
            "date": future_dt.strftime("%Y-%m-%d"),
            "value": round(val, 2),
            "confidence_upper": round(val + std_est, 2),
            "confidence_lower": round(max(0.0, val - std_est), 2)
        })
        
    return hybrid_preds

def predict_churn(df: pd.DataFrame, rfm_df: pd.DataFrame) -> tuple[list[dict], list[dict]]:
    """
    Uses Random Forest Classifier to estimate customer churn risk and computes feature importances.
    """
    cust_col = "customer_id"
    if len(rfm_df) < 5:
        # Fallback simple rule for churn probability
        churn_list = []
        for _, row in rfm_df.iterrows():
            prob = 0.85 if row["recency"] > 90 else (0.45 if row["recency"] > 45 else 0.10)
            churn_list.append({
                "customer_id": str(row[cust_col]),
                "customer_name": str(row.get("customer_name", row[cust_col])),
                "probability": prob,
                "risk_level": "High" if prob > 0.70 else ("Medium" if prob > 0.30 else "Low")
            })
        feature_importances = [
            {"feature": "Recency (R-Score)", "importance": 60.0},
            {"feature": "Monetary Value (M-Score)", "importance": 25.0},
            {"feature": "Frequency (F-Score)", "importance": 15.0}
        ]
        return churn_list, feature_importances
        
    # Build churn model features
    median_rec = rfm_df["recency"].median()
    rfm_df["churn_label"] = (rfm_df["recency"] > median_rec).astype(int)
    
    X = rfm_df[["recency", "frequency", "monetary"]].values
    y = rfm_df["churn_label"].values
    
    try:
        clf = RandomForestClassifier(n_estimators=50, random_state=42)
        clf.fit(X, y)
        probs = clf.predict_proba(X)[:, 1]
        
        importances = clf.feature_importances_
        feature_importances = [
            {"feature": "Recency (R-Score)", "importance": round(float(importances[0]) * 100, 2)},
            {"feature": "Monetary Value (M-Score)", "importance": round(float(importances[2]) * 100, 2)},
            {"feature": "Frequency (F-Score)", "importance": round(float(importances[1]) * 100, 2)}
        ]
        feature_importances = sorted(feature_importances, key=lambda x: x["importance"], reverse=True)
    except Exception:
        probs = [0.5] * len(rfm_df)
        feature_importances = [
            {"feature": "Recency (R-Score)", "importance": 45.0},
            {"feature": "Monetary Value (M-Score)", "importance": 35.0},
            {"feature": "Frequency (F-Score)", "importance": 20.0}
        ]
        
    churn_list = []
    for idx, row in rfm_df.iterrows():
        prob = float(probs[idx])
        cust_name = row.get("customer_name", row[cust_col])
        churn_list.append({
            "customer_id": str(row[cust_col]),
            "customer_name": str(cust_name) if pd.notnull(cust_name) else str(row[cust_col]),
            "probability": round(prob, 2),
            "risk_level": "High" if prob > 0.70 else ("Medium" if prob > 0.30 else "Low")
        })
        
    return churn_list, feature_importances

def create_dataset_summary_layer(kpis: dict, df: pd.DataFrame, rfm_df: pd.DataFrame, forecasting_results: list) -> dict:
    """
    Generates a structured analytical summary of the dataset.
    This summary is sent to the LLM instead of the raw data.
    """
    cust_col = "customer_id"
    
    # 1. Category summaries
    cat_summary = {}
    if "product_category" in df.columns:
        cat_grouped = df.groupby("product_category")["sales_amount"].sum()
        for cat, val in cat_grouped.items():
            cat_summary[str(cat)] = round(float(val), 2)
            
    # 2. Region summaries
    region_summary = {}
    if "region" in df.columns:
        reg_grouped = df.groupby("region")["sales_amount"].sum()
        for reg, val in reg_grouped.items():
            region_summary[str(reg)] = round(float(val), 2)
            
    # 3. Segments distribution
    seg_counts = rfm_df["segment_name"].value_counts().to_dict()
    
    # 4. Top products
    top_prods = []
    if "product_name" in df.columns:
        top_grouped = df.groupby("product_name")["sales_amount"].sum().sort_values(ascending=False).head(5)
        for prod, val in top_grouped.items():
            top_prods.append(f"{prod} (${round(float(val),2)})")
            
    # 5. Top customers
    top_custs = []
    top_cust_grouped = rfm_df.sort_values(by="monetary", ascending=False).head(5)
    for _, r in top_cust_grouped.iterrows():
        name = r.get("customer_name", r[cust_col])
        top_custs.append(f"{name} (${round(float(r['monetary']),2)})")
        
    top_cat = max(cat_summary, key=cat_summary.get) if cat_summary else "Unknown"
    
    top_prod = "Unknown"
    if "product_name" in df.columns:
        top_grouped_full = df.groupby("product_name")["sales_amount"].sum()
        if not top_grouped_full.empty:
            top_prod = str(top_grouped_full.idxmax())
            
    best_country = "Unknown"
    if "country" in df.columns:
        country_grouped = df.groupby("country")["sales_amount"].sum()
        if not country_grouped.empty:
            best_country = str(country_grouped.idxmax())
            
    # Compute business questions layer
    total_revenue = float(kpis.get("total_revenue", 0.0))
    pct = (cat_summary.get(top_cat, 0.0) / total_revenue * 100) if total_revenue > 0 else 0.0
    opportunity_headline = f"{top_cat} Expansion & Bundling"
    opportunity_content = f"{top_cat} contributed over {pct:.1f}% of the gross quarterly revenue. Initiating accessories bundles will increase average order values."
    
    churn_rate = kpis.get("churn_rate", 21.6)
    at_risk_count = seg_counts.get("At Risk", 0)
    risk_headline = "At Risk Customer Cohorts"
    risk_content = f"Customer churn risk probability averages {churn_rate:.1f}%. A subset of {at_risk_count} customers has spent more than 90 days in inactive status."
    
    revenue_drivers = []
    if "product_name" in df.columns:
        top_prod_sales = df.groupby("product_name")["sales_amount"].sum().max()
        revenue_drivers.append({
            "name": f"1. {top_prod} (Top Product)",
            "value": f"${top_prod_sales:,.2f} Sales"
        })
    if "country" in df.columns and best_country != "Unknown":
        best_country_sales = df.groupby("country")["sales_amount"].sum().max()
        pct_country = (best_country_sales / total_revenue * 100) if total_revenue > 0 else 0.0
        revenue_drivers.append({
            "name": f"2. {best_country} (Top Market)",
            "value": f"{pct_country:.1f}% share"
        })
    elif "region" in df.columns and region_summary:
        top_region = max(region_summary, key=region_summary.get)
        pct_region = (region_summary.get(top_region, 0.0) / total_revenue * 100) if total_revenue > 0 else 0.0
        revenue_drivers.append({
            "name": f"2. {top_region} (Top Region)",
            "value": f"{pct_region:.1f}% share"
        })
    if top_custs:
        revenue_drivers.append({
            "name": f"3. {top_custs[0]}",
            "value": "Top customer by monetary value"
        })
        
    summary = {
        "kpis": kpis,
        "product_categories_sales": cat_summary,
        "regional_sales": region_summary,
        "customer_segments_distribution": {str(k): int(v) for k, v in seg_counts.items()},
        "top_5_selling_products": top_prods,
        "top_5_customers_by_revenue": top_custs,
        "sales_forecasting_6_months": forecasting_results,
        "top_category": top_cat,
        "top_product": top_prod,
        "best_country": best_country,
        "opportunity_headline": opportunity_headline,
        "opportunity_content": opportunity_content,
        "risk_headline": risk_headline,
        "risk_content": risk_content,
        "revenue_drivers": revenue_drivers
    }
    
    return summary

def run_full_analytics_pipeline(dataset_id: int):
    """
    Executes the full pipeline in sequence:
    Schema detect -> clean -> KPIs -> Segment -> Forecast -> Churn -> Summarize -> AI Recommendations.
    """
    db = SessionLocal()
    dataset = None
    try:
        dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
        if not dataset:
            print(f"[ERROR] Dataset {dataset_id} not found in pipeline")
            return
            
        dataset.status = "cleaning"
        db.commit()
        
        # Clean up any existing records from previous runs for this dataset to avoid duplicates
        db.query(CleanedDataset).filter(CleanedDataset.dataset_id == dataset_id).delete()
        db.query(SalesRecord).filter(SalesRecord.dataset_id == dataset_id).delete()
        db.query(AnalyticsResult).filter(AnalyticsResult.dataset_id == dataset_id).delete()
        db.query(CustomerSegment).filter(CustomerSegment.dataset_id == dataset_id).delete()
        db.query(Prediction).filter(Prediction.dataset_id == dataset_id).delete()
        db.query(Recommendation).filter(Recommendation.dataset_id == dataset_id).delete()
        db.commit()
        
        # Load dataset
        file_path = dataset.file_path
        ext = os.path.splitext(file_path)[1].lower()
        
        print(f"[STAGE 1: LOAD] Loading file: {file_path}")
        
        if ext == ".csv":
            df = pd.read_csv(file_path)
        elif ext in [".xlsx", ".xls"]:
            df = pd.read_excel(file_path)
        elif ext == ".json":
            df = pd.read_json(file_path)
        else:
            raise ValueError(f"Unsupported file format: {ext}")
            
        print(f"[STAGE 1: LOAD] Raw dataframe shape: {df.shape}")
        print(f"[STAGE 1: LOAD] Raw columns: {list(df.columns)}")
        print(f"[STAGE 1: LOAD] Raw dataframe head:\n{df.head(3)}")
        print(f"[STAGE 1: LOAD] Raw dataframe summary:\n{df.describe(include='all')}")
        
        # Detect Schema and Clean
        mapping = dataset.column_mappings or smart_detect_schema(df)
        dataset.column_mappings = mapping
        
        print(f"[STAGE 2: SCHEMA] Schema mapping: {mapping}")
        
        clean_df, cleaning_summary = clean_dataset_df(df, mapping)
        
        print(f"[STAGE 3: CLEAN] Cleaned dataframe shape: {clean_df.shape}")
        print(f"[STAGE 3: CLEAN] Cleaning summary: {cleaning_summary}")
        
        # Save cleaned file
        cleaned_path = f"sample-datasets/cleaned_{dataset.id}_{os.path.basename(file_path)}"
        if ext == ".csv" or ext == ".json":
            clean_df.to_csv(cleaned_path, index=False)
        else:
            clean_df.to_excel(cleaned_path, index=False)
            
        cleaned_dataset = CleanedDataset(
            dataset_id=dataset.id,
            file_path=cleaned_path,
            cleaning_summary=cleaning_summary
        )
        db.add(cleaned_dataset)
        dataset.row_count = len(clean_df)
        db.commit()
        
        # Save SalesRecords to database (first 1000 for quick reference)
        sales_records = []
        for _, row in clean_df.head(1000).iterrows():
            sales_records.append(SalesRecord(
                dataset_id=dataset.id,
                customer_id=str(row.get("customer_id", "Unknown")),
                customer_name=str(row.get("customer_name", "Unknown")),
                product_id=str(row.get("product_id", "Unknown")),
                product_name=str(row.get("product_name", "Unknown")),
                product_category=str(row.get("product_category", "Unknown")),
                sales_amount=float(row.get("sales_amount", 0.0)),
                profit=float(row.get("profit", 0.0)),
                quantity=int(row.get("quantity", 1)),
                order_date=row["order_date"].to_pydatetime() if hasattr(row["order_date"], "to_pydatetime") else pd.Timestamp(row["order_date"]).to_pydatetime(),
                country=str(row.get("country", "Unknown")),
                state=str(row.get("state", "Unknown")),
                city=str(row.get("city", "Unknown")),
                region=str(row.get("region", "Unknown"))
            ))
        db.bulk_save_objects(sales_records)
        db.commit()
        
        # 1. KPIs & Sparklines trends
        kpis = calculate_kpis(clean_df)
        print(f"[STAGE 4: KPIS] KPIs computed: {kpis.keys()}")
        db.add(AnalyticsResult(
            project_id=dataset.project_id,
            dataset_id=dataset.id,
            type="kpis",
            results=kpis
        ))
        
        # 2. RFM Segmentation & Customer Segments
        rfm_df = run_rfm_segmentation(clean_df)
        segments_objs = []
        cust_col = "customer_id"
        for _, row in rfm_df.iterrows():
            segments_objs.append(CustomerSegment(
                project_id=dataset.project_id,
                dataset_id=dataset.id,
                customer_id=str(row[cust_col]),
                customer_name=str(row.get("customer_name", row[cust_col])),
                rfm_recency=int(row["recency"]),
                rfm_frequency=int(row["frequency"]),
                rfm_monetary=float(row["monetary"]),
                segment_name=str(row["segment_name"]),
                cluster_id=int(row["cluster_id"])
            ))
        db.bulk_save_objects(segments_objs)
        db.commit()
        
        # 3. Monthly customer trend growth and feature importances
        # Churn Prediction
        churn_results, feature_importances = predict_churn(clean_df, rfm_df)
        print(f"[STAGE 5: CHURN] Feature importances: {feature_importances}")
        
        monthly_cust_trend = []
        try:
            clean_df_sorted = clean_df.sort_values("order_date")
            clean_df_sorted["month"] = clean_df_sorted["order_date"].dt.to_period("M")
            first_purchases = clean_df_sorted.groupby(cust_col)["month"].min().to_dict()
            unique_months = sorted(clean_df_sorted["month"].unique())
            for idx, month in enumerate(unique_months):
                month_df = clean_df_sorted[clean_df_sorted["month"] == month]
                active_custs = set(month_df[cust_col].unique())
                new_custs = sum(1 for c in active_custs if first_purchases.get(c) == month)
                if idx > 0:
                    prev_month = unique_months[idx - 1]
                    prev_month_df = clean_df_sorted[clean_df_sorted["month"] == prev_month]
                    prev_active = set(prev_month_df[cust_col].unique())
                    retained = active_custs.intersection(prev_active)
                    retention_rate = round(float(len(retained) / len(prev_active) * 100), 2) if len(prev_active) > 0 else 0.0
                else:
                    retention_rate = 100.0
                monthly_cust_trend.append({
                    "month": month.strftime("%b"),
                    "activeCustomers": len(active_custs),
                    "newCustomers": new_custs,
                    "retentionRate": retention_rate
                })
        except Exception as e:
            print(f"[ERROR] monthly customer trend: {e}")

        # Save RFM Analytics cache
        db.add(AnalyticsResult(
            project_id=dataset.project_id,
            dataset_id=dataset.id,
            type="customer",
            results={
                "segment_distribution": rfm_df["segment_name"].value_counts().to_dict(),
                "average_monetary_by_segment": rfm_df.groupby("segment_name")["monetary"].mean().to_dict(),
                "average_recency_by_segment": rfm_df.groupby("segment_name")["recency"].mean().to_dict(),
                "monthly_customer_trend": monthly_cust_trend,
                "feature_importances": feature_importances
            }
        ))
        
        # 4. Product Analytics
        prod_metrics = {}
        category_trends = []
        tracked_categories = []
        try:
            if "product_category" in clean_df.columns:
                prod_metrics["by_category"] = clean_df.groupby("product_category").agg(
                    revenue=("sales_amount", "sum"),
                    profit=("profit", "sum"),
                    sales=("quantity", "sum")
                ).reset_index().to_dict(orient="records")
                
                # Monthly trends for categories
                top_cats = clean_df.groupby("product_category")["sales_amount"].sum().sort_values(ascending=False).head(3).index.tolist()
                tracked_categories = top_cats
                
                clean_df_sorted = clean_df.sort_values("order_date")
                clean_df_sorted["month"] = clean_df_sorted["order_date"].dt.to_period("M")
                unique_months = sorted(clean_df_sorted["month"].unique())
                
                for month in unique_months:
                    month_df = clean_df_sorted[clean_df_sorted["month"] == month]
                    trend_entry = {"month": month.strftime("%b")}
                    for cat in top_cats:
                        cat_sales = float(month_df[month_df["product_category"] == cat]["sales_amount"].sum())
                        trend_entry[cat] = round(cat_sales, 2)
                    category_trends.append(trend_entry)
                    
            if "product_name" in clean_df.columns:
                prod_metrics["top_products"] = clean_df.groupby("product_name").agg(
                    revenue=("sales_amount", "sum"),
                    profit=("profit", "sum")
                ).sort_values("revenue", ascending=False).head(10).reset_index().to_dict(orient="records")
        except Exception as e:
            print(f"[ERROR] Category trends: {e}")
            
        prod_metrics["category_trends"] = category_trends
        prod_metrics["tracked_categories"] = tracked_categories
        
        db.add(AnalyticsResult(
            project_id=dataset.project_id,
            dataset_id=dataset.id,
            type="product",
            results=prod_metrics
        ))
        
        # 5. Regional Analytics
        reg_metrics = {}
        if "region" in clean_df.columns:
            reg_metrics["by_region"] = clean_df.groupby("region").agg(
                revenue=("sales_amount", "sum"),
                profit=("profit", "sum")
            ).reset_index().to_dict(orient="records")
            
        if "country" in clean_df.columns:
            reg_metrics["by_country"] = clean_df.groupby("country").agg(
                revenue=("sales_amount", "sum"),
                profit=("profit", "sum"),
                customers=("customer_id", "nunique")
            ).reset_index().to_dict(orient="records")
            
        db.add(AnalyticsResult(
            project_id=dataset.project_id,
            dataset_id=dataset.id,
            type="regional",
            results=reg_metrics
        ))
        
        # 6. Forecasting
        forecast_results = run_forecasting(clean_df)
        forecast_objs = []
        for f in forecast_results:
            forecast_objs.append(Prediction(
                project_id=dataset.project_id,
                dataset_id=dataset.id,
                type="sales_forecast",
                target_id=f["date"],
                value=f["value"],
                details={"confidence_upper": f["confidence_upper"], "confidence_lower": f["confidence_lower"]}
            ))
        db.bulk_save_objects(forecast_objs)
        db.commit()
        
        # Save churn predictions
        churn_objs = []
        for c in churn_results:
            churn_objs.append(Prediction(
                project_id=dataset.project_id,
                dataset_id=dataset.id,
                type="churn",
                target_id=c["customer_id"],
                value=c["probability"],
                details={"risk_level": c["risk_level"], "customer_name": c["customer_name"]}
            ))
        db.bulk_save_objects(churn_objs)
        db.commit()
        
        # 7. Create Summarization Layer
        summary_layer = create_dataset_summary_layer(kpis, clean_df, rfm_df, forecast_results)
        db.add(AnalyticsResult(
            project_id=dataset.project_id,
            dataset_id=dataset.id,
            type="summary_layer",
            results=summary_layer
        ))
        db.commit()
        
        # 8. EDA details (Histograms, box plot, correlation matrix)
        eda_results = {}
        
        # Correlation
        corr_features = ["sales_amount", "profit", "quantity"]
        corr_matrix = []
        try:
            corr_df = clean_df[corr_features].corr().fillna(0.0)
            for r in corr_features:
                for c in corr_features:
                    corr_matrix.append({
                        "row": "Sales Amount" if r == "sales_amount" else (r.capitalize() if r == "profit" else "Quantity"),
                        "col": "Sales Amount" if c == "sales_amount" else (c.capitalize() if c == "profit" else "Quantity"),
                        "val": round(float(corr_df.loc[r, c]), 2)
                    })
        except Exception as e:
            print(f"[ERROR] Correlation: {e}")
        eda_results["correlation_matrix"] = corr_matrix
        
        # Sales distribution
        sales_distribution = []
        try:
            sales_bins = [0, 50, 100, 250, 500, 1000, float('inf')]
            sales_labels = ["$0-50", "$50-100", "$100-250", "$250-500", "$500-1000", "$1000+"]
            sales_cuts = pd.cut(clean_df["sales_amount"], bins=sales_bins, labels=sales_labels, right=False)
            sales_dist = sales_cuts.value_counts().sort_index().to_dict()
            sales_distribution = [{"bin": k, "count": int(v)} for k, v in sales_dist.items()]
        except Exception as e:
            print(f"[ERROR] Sales distribution: {e}")
        eda_results["sales_distribution"] = sales_distribution
        
        # Qty distribution
        qty_distribution = []
        try:
            qty_bins = [0, 1, 2, 3, 4, float('inf')]
            qty_labels = ["1 unit", "2 units", "3 units", "4 units", "5+ units"]
            qty_cuts = pd.cut(clean_df["quantity"], bins=qty_bins, labels=qty_labels, right=True)
            qty_dist = qty_cuts.value_counts().sort_index().to_dict()
            qty_distribution = [{"bin": k, "count": int(v)} for k, v in qty_dist.items()]
        except Exception as e:
            print(f"[ERROR] Qty distribution: {e}")
        eda_results["qty_distribution"] = qty_distribution
        
        # Box plot stats
        box_plot_stats = []
        try:
            for metric in ["sales_amount", "profit", "quantity"]:
                series = clean_df[metric].dropna()
                if len(series) > 0:
                    q1 = float(series.quantile(0.25))
                    median = float(series.quantile(0.50))
                    q3 = float(series.quantile(0.75))
                    iqr = q3 - q1
                    lower_bound = q1 - 1.5 * iqr
                    upper_bound = q3 + 1.5 * iqr
                    
                    min_val = float(series.min())
                    max_val = float(series.max())
                    outliers = int(((series < lower_bound) | (series > upper_bound)).sum())
                    
                    box_plot_stats.append({
                        "metric": "Sales Amount" if metric == "sales_amount" else (metric.capitalize() if metric == "profit" else "Quantity"),
                        "min": round(min_val, 2),
                        "q1": round(q1, 2),
                        "median": round(median, 2),
                        "q3": round(q3, 2),
                        "max": round(max_val, 2),
                        "outliers": outliers
                    })
        except Exception as e:
            print(f"[ERROR] Box plot: {e}")
        eda_results["box_plot_stats"] = box_plot_stats
        
        db.add(AnalyticsResult(
            project_id=dataset.project_id,
            dataset_id=dataset.id,
            type="eda",
            results=eda_results
        ))
        db.commit()
        
        # Identify underrepresented region dynamically
        regional_sales = summary_layer.get("regional_sales", {})
        if regional_sales:
            underrepresented = min(regional_sales, key=regional_sales.get)
        else:
            underrepresented = "lower-performing regional zones"
            
        # 9. Generate 5 Business Recommendations
        recs = [
            Recommendation(
                project_id=dataset.project_id,
                dataset_id=dataset.id,
                category="cross-sell",
                content=f"Cross-sell items in top category '{summary_layer.get('top_category', 'Electronics')}' to increase average order values (currently at ${kpis.get('average_order_value', 0.0):,.2f}).",
                impact_score="High",
                confidence_score=0.85
            ),
            Recommendation(
                project_id=dataset.project_id,
                dataset_id=dataset.id,
                category="retention",
                content=f"Engage the {summary_layer.get('customer_segments_distribution', {}).get('At Risk', 0)} clients in 'At Risk' RFM segments with a custom loyalty campaign to improve the {kpis.get('retention_rate', 0.0):.1f}% retention rate.",
                impact_score="High",
                confidence_score=0.90
            ),
            Recommendation(
                project_id=dataset.project_id,
                dataset_id=dataset.id,
                category="upsell",
                content=f"Create promotional bundling packages for products matching the top seller: '{summary_layer.get('top_product', 'Laptop')}' to increase transaction sizes.",
                impact_score="Medium",
                confidence_score=0.80
            ),
            Recommendation(
                project_id=dataset.project_id,
                dataset_id=dataset.id,
                category="inventory",
                content=f"Perform stock audit for category '{summary_layer.get('top_category', 'Electronics')}' in leading market '{summary_layer.get('best_country', 'United States')}' to prevent inventory bottlenecks.",
                impact_score="Medium",
                confidence_score=0.75
            ),
            Recommendation(
                project_id=dataset.project_id,
                dataset_id=dataset.id,
                category="expansion",
                content=f"Direct targeted ads and expand product lines in underrepresented region '{underrepresented}' to balance geographic sales distribution.",
                impact_score="Low",
                confidence_score=0.70
            )
        ]
        db.bulk_save_objects(recs)
        db.commit()
        
        # Complete dataset status
        dataset.status = "processed"
        db.commit()
        print(f"[SUCCESS] Pipeline executed successfully for dataset {dataset_id}")
        
    except Exception as e:
        db.rollback()
        if dataset:
            dataset.status = "error"
            dataset.error_message = str(e)
            db.commit()
        print(f"[ERROR] Pipeline failed for dataset {dataset_id}: {e}")
        raise e
    finally:
        db.close()

@celery.task
def run_full_analytics_pipeline_task(dataset_id: int):
    run_full_analytics_pipeline(dataset_id)
