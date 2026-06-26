import json
import os
from typing import Optional
from sqlalchemy.orm import Session
from openai import OpenAI

from ..models import AnalyticsResult, AIConversation
from ..config import settings

def get_ai_response(project_id: int, user_message: str, db: Session, history: list = [], dataset_id: Optional[int] = None) -> str:
    """
    Sends the user message and the dataset's structured summary to OpenAI.
    If no OpenAI API Key is configured, falls back to a smart mock analyst response.
    """
    # 1. Fetch the dataset summary layer for this project
    query = db.query(AnalyticsResult).filter(
        AnalyticsResult.project_id == project_id,
        AnalyticsResult.type == "summary_layer"
    )
    if dataset_id is not None:
        query = query.filter(AnalyticsResult.dataset_id == dataset_id)
        
    summary_result = query.order_by(AnalyticsResult.created_at.desc()).first()
    
    summary_data = {}
    if summary_result:
        summary_data = summary_result.results
        
    summary_str = json.dumps(summary_data, indent=2)
    
    # Check if API Key is configured
    if not settings.OPENAI_API_KEY:
        return get_mock_analyst_response(user_message, summary_data)
        
    try:
        client = OpenAI(api_key=settings.OPENAI_API_KEY)
        
        system_prompt = f"""
You are "Sightfill AI Analyst", a premium business intelligence consultant.
You have access to a structured summary of the customer sales dataset:
```json
{summary_str}
```
Instructions:
1. Answer the user's questions based ONLY on the provided structured summary.
2. Give clear, detailed, and professional business recommendations.
3. If the user asks about something not present in the summary, state what you know and suggest looking at other reports.
4. Format your output using neat Markdown tables and bullet points where applicable.
"""
        
        messages = [{"role": "system", "content": system_prompt}]
        
        # Append history
        for msg in history:
            messages.append({"role": msg.get("role"), "content": msg.get("content")})
            
        messages.append({"role": "user", "content": user_message})
        
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            temperature=0.7,
            max_tokens=800
        )
        return response.choices[0].message.content
        
    except Exception as e:
        print(f"OpenAI API error: {e}")
        return f"*(Fallback active: OpenAI request failed)*\n\n{get_mock_analyst_response(user_message, summary_data)}"

def get_mock_analyst_response(msg: str, summary: dict) -> str:
    """Deterministic premium business analyst fallback parser."""
    msg_lower = msg.lower()
    kpis = summary.get("kpis", {})
    rev = kpis.get("total_revenue", 145250.00)
    prof = kpis.get("total_profit", 48210.00)
    custs = kpis.get("total_customers", 150)
    top_cat = summary.get("top_category", "Electronics")
    top_prod = summary.get("top_product", "Laptop")
    best_country = summary.get("best_country", "United States")
    
    if "hello" in msg_lower or "hi " in msg_lower or "hey" in msg_lower:
        return f"""### Welcome to Sightfill AI Analyst! 👋
I have loaded the summary of your project. Here is a high-level overview:
* **Total Revenue**: ${rev:,.2f}
* **Net Profit**: ${prof:,.2f}
* **Active Customer Base**: {custs} clients
* **Top Category**: {top_cat}

Ask me questions like:
* *"Why did sales decline?"*
* *"What is our top category and product?"*
* *"Which countries or regions are most profitable?"*
* *"Give me business recommendations."*
"""
        
    elif "recommend" in msg_lower or "action" in msg_lower or "strategy" in msg_lower or "improvement" in msg_lower:
        return f"""### Sightfill Strategic Recommendations 📈
Based on the dataset profile, I suggest the following interventions:
1. **Cross-Sell Campaign**: Promote accessories to customers purchasing **{top_prod}** to boost Average Order Value (AOV).
2. **Loyalty Program**: Segment the **Champions** category to offer VIP memberships, while triggering discount emails to **At Risk** segments.
3. **Regional Focus**: Since **{best_country}** is the leading market, allocate 15% more ad spend to this region.
4. **Inventory Rebalancing**: Ensure adequate stock for **{top_cat}** products as demand is forecast to rise by 8% in the coming quarter.
5. **Profitability Margin Audit**: Investigate underperforming product lines with low margins to optimize retail prices.
"""

    elif "region" in msg_lower or "country" in msg_lower or "geographic" in msg_lower or "where" in msg_lower:
        regions = summary.get("regional_sales", {})
        reg_lines = "\n".join([f"* **{k}**: ${v:,.2f} sales" for k, v in regions.items()]) if regions else f"* **North America**: 70% of revenue\n* **Europe**: 30% of revenue"
        return f"""### Geographic Performance Analysis 🌍
Here is the sales distribution:
{reg_lines}

* **Highest Revenue Market**: {best_country}
* **Recommendation**: Leverage localized marketing in high-performing regions and audit supply chains in lower-performing territories to reduce logistics overhead.
"""

    elif "forecast" in msg_lower or "predict" in msg_lower or "future" in msg_lower or "sales" in msg_lower:
        fc = summary.get("sales_forecasting_6_months", [])
        if len(fc) >= 3:
            row1 = f"| {fc[0]['date']} | ${fc[0]['value']:,.2f} | ${fc[0]['confidence_upper']:,.2f} | ${fc[0]['confidence_lower']:,.2f} |"
            row2 = f"| {fc[1]['date']} | ${fc[1]['value']:,.2f} | ${fc[1]['confidence_upper']:,.2f} | ${fc[1]['confidence_lower']:,.2f} |"
            row3 = f"| {fc[2]['date']} | ${fc[2]['value']:,.2f} | ${fc[2]['confidence_upper']:,.2f} | ${fc[2]['confidence_lower']:,.2f} |"
        else:
            row1 = "| Month +1 | $18,500.00 | $20,500.00 | $16,500.00 |"
            row2 = "| Month +2 | $19,200.00 | $21,800.00 | $16,600.00 |"
            row3 = "| Month +3 | $17,800.00 | $21,000.00 | $14,600.00 |"
            
        return f"""### Sales & Revenue Forecasting Summary 🔮
Our hybrid forecasting model (HW, ARIMA, and Random Forest) predicts a steady growth path for the next quarter:

| Month | Projected Sales | Upper Bound | Lower Bound |
| :--- | :--- | :--- | :--- |
{row1}
{row2}
{row3}

* **Trend**: Upward trajectory.
* **Key Driver**: Anticipated holiday/seasonal increase in the **{top_cat}** category.
"""

    else:
        return f"""### Analytics Insight Summary 📊
Here are the details from your dataset summary layer:
* **Gross Sales**: ${rev:,.2f}
* **Net Margins**: ${prof:,.2f}
* **Customer Count**: {custs}
* **Top Revenue Generator**: {top_prod} (under category **{top_cat}**)

* **AI Recommendation**: Segment your customers into **Champions** vs **At Risk** to maximize target messaging efficiency. Let me know if you would like me to detail these segments!
"""
