import os
import sys
import datetime
import bcrypt

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import Base, engine, SessionLocal
from app.models import User, Workspace, Project, Dataset, CleanedDataset, SalesRecord, AnalyticsResult, CustomerSegment, Prediction, Recommendation, AIConversation, Notification, AuditLog

def get_password_hash(password: str) -> str:
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")

def seed():
    print("Initializing database seeder...")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    try:
        # Check if users already exist
        admin_user = db.query(User).filter(User.email == "admin@sightfill.com").first()
        if not admin_user:
            admin_user = User(
                email="admin@sightfill.com",
                hashed_password=get_password_hash("adminpassword"),
                is_verified=True,
                role="admin"
            )
            db.add(admin_user)
            print("Seeded admin user (admin@sightfill.com / adminpassword)")
            
        demo_user = db.query(User).filter(User.email == "demo@sightfill.com").first()
        if not demo_user:
            demo_user = User(
                email="demo@sightfill.com",
                hashed_password=get_password_hash("demopassword"),
                is_verified=True,
                role="user"
            )
            db.add(demo_user)
            print("Seeded demo user (demo@sightfill.com / demopassword)")
            
        db.commit()
        db.refresh(demo_user)
        
        # 2. Seed Workspaces
        workspace = db.query(Workspace).filter(Workspace.owner_id == demo_user.id).first()
        if not workspace:
            workspace = Workspace(
                name="Acme Corporation Workspace",
                owner_id=demo_user.id
            )
            db.add(workspace)
            db.commit()
            db.refresh(workspace)
            print(f"Seeded workspace: {workspace.name}")
            
        # 3. Seed Projects
        project = db.query(Project).filter(Project.workspace_id == workspace.id).first()
        if not project:
            project = Project(
                name="Sales Insights & Forecasting",
                description="Demo project analyzing corporate retail sales, customer churn risk, and monthly revenue forecasting.",
                workspace_id=workspace.id
            )
            db.add(project)
            db.commit()
            db.refresh(project)
            print(f"Seeded project: {project.name}")
            
        # 4. Seed Dataset
        dataset = db.query(Dataset).filter(Dataset.project_id == project.id).first()
        if not dataset:
            dataset = Dataset(
                name="retail_sales_demo.csv",
                project_id=project.id,
                file_path="sample-datasets/retail_sales.csv",
                row_count=1200,
                status="processed",
                column_mappings={
                    "Customer ID": "customer_id",
                    "Customer Name": "customer_name",
                    "Product Name": "product_name",
                    "Product Category": "product_category",
                    "Sales Amount": "sales_amount",
                    "Profit": "profit",
                    "Quantity": "quantity",
                    "Order Date": "order_date",
                    "Country": "country",
                    "State": "state",
                    "Region": "region"
                }
            )
            db.add(dataset)
            db.commit()
            db.refresh(dataset)
            print(f"Seeded dataset metadata: {dataset.name}")
            
            cleaned_dataset = CleanedDataset(
                dataset_id=dataset.id,
                file_path="sample-datasets/retail_sales.csv",
                cleaning_summary={
                    "duplicates_removed": 0,
                    "missing_values_filled": {
                        "Customer Name": 0,
                        "Profit": 0
                    },
                    "outliers_detected": 14,
                    "records_processed": 1200
                }
            )
            db.add(cleaned_dataset)
            
            # Seed Sales Records
            sales_data = [
                {"customer_id": "Cust-1001", "customer_name": "Alice Johnson", "product_name": "Smartphone", "product_category": "Electronics", "sales_amount": 699.00, "profit": 210.00, "quantity": 1, "order_date": datetime.datetime.now() - datetime.timedelta(days=120), "country": "United States", "state": "California", "region": "North America"},
                {"customer_id": "Cust-1002", "customer_name": "Bob Smith", "product_name": "Laptop", "product_category": "Electronics", "sales_amount": 1998.00, "profit": 550.00, "quantity": 2, "order_date": datetime.datetime.now() - datetime.timedelta(days=110), "country": "United States", "state": "Texas", "region": "North America"},
                {"customer_id": "Cust-1003", "customer_name": "Charlie Brown", "product_name": "Jacket", "product_category": "Clothing", "sales_amount": 120.00, "profit": 40.00, "quantity": 1, "order_date": datetime.datetime.now() - datetime.timedelta(days=105), "country": "Canada", "state": "Ontario", "region": "North America"},
                {"customer_id": "Cust-1004", "customer_name": "Diana Prince", "product_name": "Coffee Maker", "product_category": "Home & Kitchen", "sales_amount": 178.00, "profit": 60.00, "quantity": 2, "order_date": datetime.datetime.now() - datetime.timedelta(days=90), "country": "United States", "state": "New York", "region": "North America"},
                {"customer_id": "Cust-1005", "customer_name": "Evan Wright", "product_name": "Running Shoes", "product_category": "Sports", "sales_amount": 95.00, "profit": 35.00, "quantity": 1, "order_date": datetime.datetime.now() - datetime.timedelta(days=80), "country": "United Kingdom", "state": "England", "region": "Europe"},
                {"customer_id": "Cust-1006", "customer_name": "Fiona Gallagher", "product_name": "Smartwatch", "product_category": "Electronics", "sales_amount": 199.00, "profit": 65.00, "quantity": 1, "order_date": datetime.datetime.now() - datetime.timedelta(days=70), "country": "Germany", "state": "Bavaria", "region": "Europe"},
                {"customer_id": "Cust-1007", "customer_name": "George Clark", "product_name": "Blender", "product_category": "Home & Kitchen", "sales_amount": 49.00, "profit": 15.00, "quantity": 1, "order_date": datetime.datetime.now() - datetime.timedelta(days=60), "country": "France", "state": "Île-de-France", "region": "Europe"},
                {"customer_id": "Cust-1001", "customer_name": "Alice Johnson", "product_name": "Headphones", "product_category": "Electronics", "sales_amount": 150.00, "profit": 45.00, "quantity": 1, "order_date": datetime.datetime.now() - datetime.timedelta(days=45), "country": "United States", "state": "California", "region": "North America"},
                {"customer_id": "Cust-1002", "customer_name": "Bob Smith", "product_name": "Jeans", "product_category": "Clothing", "sales_amount": 60.00, "profit": 20.00, "quantity": 1, "order_date": datetime.datetime.now() - datetime.timedelta(days=30), "country": "United States", "state": "Texas", "region": "North America"},
                {"customer_id": "Cust-1008", "customer_name": "Hannah Abbott", "product_name": "Lipstick", "product_category": "Beauty", "sales_amount": 36.00, "profit": 12.00, "quantity": 2, "order_date": datetime.datetime.now() - datetime.timedelta(days=15), "country": "United Kingdom", "state": "Scotland", "region": "Europe"}
            ]
            for s in sales_data:
                record = SalesRecord(
                    dataset_id=dataset.id,
                    customer_id=s["customer_id"],
                    customer_name=s["customer_name"],
                    product_name=s["product_name"],
                    product_category=s["product_category"],
                    sales_amount=s["sales_amount"],
                    profit=s["profit"],
                    quantity=s["quantity"],
                    order_date=s["order_date"],
                    country=s["country"],
                    state=s["state"],
                    region=s["region"]
                )
                db.add(record)
            
            # Seed cached Analytics Results
            kpis_res = AnalyticsResult(
                project_id=project.id,
                dataset_id=dataset.id,
                type="kpis",
                results={
                    "total_revenue": 145250.00,
                    "total_profit": 48210.00,
                    "total_orders": 1200,
                    "total_customers": 150,
                    "average_order_value": 121.04,
                    "customer_lifetime_value": 968.33,
                    "retention_rate": 78.4,
                    "churn_rate": 21.6
                }
            )
            
            regional_res = AnalyticsResult(
                project_id=project.id,
                dataset_id=dataset.id,
                type="regional",
                results={
                    "by_region": [
                        {"region": "North America", "revenue": 105250.00, "profit": 35110.00},
                        {"region": "Europe", "revenue": 40000.00, "profit": 13100.00}
                    ],
                    "by_country": [
                        {"country": "United States", "revenue": 85250.00, "profit": 28110.00},
                        {"country": "Canada", "revenue": 20000.00, "profit": 7000.00},
                        {"country": "United Kingdom", "revenue": 22000.00, "profit": 7200.00},
                        {"country": "Germany", "revenue": 10000.00, "profit": 3400.00},
                        {"country": "France", "revenue": 8000.00, "profit": 2500.00}
                    ]
                }
            )
            
            product_res = AnalyticsResult(
                project_id=project.id,
                dataset_id=dataset.id,
                type="product",
                results={
                    "by_category": [
                        {"category": "Electronics", "revenue": 72500.00, "profit": 22100.00, "sales": 400},
                        {"category": "Clothing", "revenue": 32100.00, "profit": 11500.00, "sales": 320},
                        {"category": "Home & Kitchen", "revenue": 21450.00, "profit": 7210.00, "sales": 230},
                        {"category": "Sports", "revenue": 12200.00, "profit": 4800.00, "sales": 150},
                        {"category": "Beauty", "revenue": 7000.00, "profit": 2600.00, "sales": 100}
                    ],
                    "top_products": [
                        {"name": "Laptop", "revenue": 38961.00, "profit": 11688.00},
                        {"name": "Smartphone", "revenue": 25863.00, "profit": 7758.00},
                        {"name": "Jacket", "revenue": 14400.00, "profit": 4800.00},
                        {"name": "Air Fryer", "revenue": 11900.00, "profit": 3570.00},
                        {"name": "Smartwatch", "revenue": 9950.00, "profit": 3250.00}
                    ]
                }
            )
            
            summary_res = AnalyticsResult(
                project_id=project.id,
                dataset_id=dataset.id,
                type="summary_layer",
                results={
                    "total_revenue": 145250.00,
                    "total_profit": 48210.00,
                    "customer_count": 150,
                    "order_count": 1200,
                    "top_category": "Electronics",
                    "top_product": "Laptop",
                    "best_country": "United States",
                    "top_segment": "Champions (45 customers)",
                    "churn_stats": "Average customer churn risk is 21.6%. Electronics customers show lower churn risk compared to Clothing.",
                    "recent_growth_trend": "Sales increased by 12% in the last quarter, primarily driven by North America Laptop sales."
                }
            )
            
            db.add(kpis_res)
            db.add(regional_res)
            db.add(product_res)
            db.add(summary_res)
            
            # Seed Customer Segments
            segments = [
                CustomerSegment(project_id=project.id, dataset_id=dataset.id, customer_id="Cust-1001", customer_name="Alice Johnson", rfm_recency=15, rfm_frequency=12, rfm_monetary=849.00, segment_name="Champions", cluster_id=0),
                CustomerSegment(project_id=project.id, dataset_id=dataset.id, customer_id="Cust-1002", customer_name="Bob Smith", rfm_recency=30, rfm_frequency=8, rfm_monetary=2058.00, segment_name="Loyal Customers", cluster_id=0),
                CustomerSegment(project_id=project.id, dataset_id=dataset.id, customer_id="Cust-1003", customer_name="Charlie Brown", rfm_recency=105, rfm_frequency=1, rfm_monetary=120.00, segment_name="At Risk", cluster_id=1),
                CustomerSegment(project_id=project.id, dataset_id=dataset.id, customer_id="Cust-1004", customer_name="Diana Prince", rfm_recency=90, rfm_frequency=2, rfm_monetary=178.00, segment_name="Potential Loyalists", cluster_id=2),
                CustomerSegment(project_id=project.id, dataset_id=dataset.id, customer_id="Cust-1005", customer_name="Evan Wright", rfm_recency=80, rfm_frequency=1, rfm_monetary=95.00, segment_name="At Risk", cluster_id=1),
                CustomerSegment(project_id=project.id, dataset_id=dataset.id, customer_id="Cust-1006", customer_name="Fiona Gallagher", rfm_recency=70, rfm_frequency=3, rfm_monetary=550.00, segment_name="Loyal Customers", cluster_id=0),
                CustomerSegment(project_id=project.id, dataset_id=dataset.id, customer_id="Cust-1007", customer_name="George Clark", rfm_recency=60, rfm_frequency=1, rfm_monetary=49.00, segment_name="New Customers", cluster_id=3)
            ]
            db.bulk_save_objects(segments)
            
            # Seed Predictions (Churn and Forecasting)
            preds = [
                Prediction(project_id=project.id, dataset_id=dataset.id, type="churn", target_id="Cust-1001", value=0.08, details={"risk_level": "Low", "last_active": "15 days ago"}),
                Prediction(project_id=project.id, dataset_id=dataset.id, type="churn", target_id="Cust-1002", value=0.15, details={"risk_level": "Low", "last_active": "30 days ago"}),
                Prediction(project_id=project.id, dataset_id=dataset.id, type="churn", target_id="Cust-1003", value=0.82, details={"risk_level": "High", "last_active": "105 days ago"}),
                Prediction(project_id=project.id, dataset_id=dataset.id, type="churn", target_id="Cust-1004", value=0.45, details={"risk_level": "Medium", "last_active": "90 days ago"}),
                
                Prediction(project_id=project.id, dataset_id=dataset.id, type="sales_forecast", target_id="2026-07-31", value=18500.00, details={"confidence_upper": 20500.00, "confidence_lower": 16500.00}),
                Prediction(project_id=project.id, dataset_id=dataset.id, type="sales_forecast", target_id="2026-08-31", value=19200.00, details={"confidence_upper": 21800.00, "confidence_lower": 16600.00}),
                Prediction(project_id=project.id, dataset_id=dataset.id, type="sales_forecast", target_id="2026-09-30", value=17800.00, details={"confidence_upper": 21000.00, "confidence_lower": 14600.00}),
                Prediction(project_id=project.id, dataset_id=dataset.id, type="sales_forecast", target_id="2026-10-31", value=20100.00, details={"confidence_upper": 23900.00, "confidence_lower": 16300.00}),
                Prediction(project_id=project.id, dataset_id=dataset.id, type="sales_forecast", target_id="2026-11-30", value=24500.00, details={"confidence_upper": 29000.00, "confidence_lower": 20000.00}),
                Prediction(project_id=project.id, dataset_id=dataset.id, type="sales_forecast", target_id="2026-12-31", value=29800.00, details={"confidence_upper": 35200.00, "confidence_lower": 24400.00})
            ]
            db.bulk_save_objects(preds)
            
            # Seed Recommendations
            recs = [
                Recommendation(project_id=project.id, dataset_id=dataset.id, category="cross-sell", content="Promote Headphones and Chargers to Laptop buyers. 65% of laptop buyers purchase accessories within 30 days.", impact_score="High", confidence_score=0.88),
                Recommendation(project_id=project.id, dataset_id=dataset.id, category="retention", content="Run a targeted email campaign for the 'At Risk' segment (e.g. Cust-1003) offering a 15% discount on Electronics to boost frequency.", impact_score="High", confidence_score=0.92),
                Recommendation(project_id=project.id, dataset_id=dataset.id, category="upsell", content="Encourage Basic Plan subscribers who average >20 logins/month to upgrade to Professional Plan. 35 users fit this pattern.", impact_score="Medium", confidence_score=0.78),
                Recommendation(project_id=project.id, dataset_id=dataset.id, category="inventory", content="Increase Laptop stock by 20% in the US Western region (California) ahead of Q4. Demand is forecast to peak in December.", impact_score="Medium", confidence_score=0.85),
                Recommendation(project_id=project.id, dataset_id=dataset.id, category="expansion", content="Expand marketing campaign in Germany/Bavaria. Germany is the fastest growing European sub-region with a 45% YoY increase in Electronics orders.", impact_score="High", confidence_score=0.81)
            ]
            db.bulk_save_objects(recs)
            
            convo = AIConversation(
                project_id=project.id,
                user_id=demo_user.id,
                title="Q2 Performance Analysis",
                messages=[
                    {"role": "user", "content": "How did we perform in Q2 compared to Q1?"},
                    {"role": "assistant", "content": "Based on the uploaded dataset, total Q2 revenue was $42,500, representing an 8% growth compared to Q1 ($39,350). The growth was primarily driven by Electronics, which contributed 50% of the revenue. The fastest-growing region was North America (California +15%)."}
                ]
            )
            db.add(convo)
            
            db.add(Notification(user_id=demo_user.id, title="Dataset Processed Successfully", message="Your dataset retail_sales_demo.csv has been cleaned and analytics generated."))
            db.add(AuditLog(user_id=demo_user.id, action="seed_data", details={"status": "completed", "project_id": project.id}))
            
            db.commit()
            print("Successfully seeded all tables with demo data!")
            
    except Exception as e:
        db.rollback()
        print(f"Error during seeding: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed()
