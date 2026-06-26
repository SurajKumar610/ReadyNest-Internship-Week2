import os
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

def create_sample_directories():
    os.makedirs("sample-datasets", exist_ok=True)

def generate_retail_sales():
    print("Generating Retail Sales dataset...")
    np.random.seed(42)
    rows = 1200
    
    # Generate dates over last 2 years
    base_date = datetime.today() - timedelta(days=730)
    dates = [base_date + timedelta(days=int(i)) for i in np.random.randint(0, 730, rows)]
    
    customers = [f"Cust-{1000 + i}" for i in range(150)]
    customer_names = [f"Customer {1000 + i}" for i in range(150)]
    cust_map = dict(zip(customers, customer_names))
    
    categories = ["Clothing", "Electronics", "Home & Kitchen", "Beauty", "Sports"]
    products = {
        "Clothing": ["T-Shirt", "Jeans", "Jacket", "Sneakers", "Socks"],
        "Electronics": ["Smartphone", "Laptop", "Headphones", "Smartwatch", "Charger"],
        "Home & Kitchen": ["Coffee Maker", "Blender", "Air Fryer", "Dinner Set", "Knife Set"],
        "Beauty": ["Lipstick", "Foundation", "Perfume", "Moisturizer", "Shampoo"],
        "Sports": ["Yoga Mat", "Dumbbells", "Water Bottle", "Running Shoes", "Backpack"]
    }
    
    prices = {
        "T-Shirt": 25.0, "Jeans": 60.0, "Jacket": 120.0, "Sneakers": 80.0, "Socks": 10.0,
        "Smartphone": 699.0, "Laptop": 999.0, "Headphones": 150.0, "Smartwatch": 199.0, "Charger": 29.0,
        "Coffee Maker": 89.0, "Blender": 49.0, "Air Fryer": 119.0, "Dinner Set": 79.0, "Knife Set": 59.0,
        "Lipstick": 18.0, "Foundation": 35.0, "Perfume": 75.0, "Moisturizer": 25.0, "Shampoo": 15.0,
        "Yoga Mat": 29.0, "Dumbbells": 45.0, "Water Bottle": 20.0, "Running Shoes": 95.0, "Backpack": 55.0
    }
    
    countries = ["United States", "Canada", "United Kingdom", "Germany", "France"]
    states = {
        "United States": ["California", "New York", "Texas", "Florida", "Illinois"],
        "Canada": ["Ontario", "Quebec", "British Columbia", "Alberta"],
        "United Kingdom": ["England", "Scotland", "Wales"],
        "Germany": ["Bavaria", "Berlin", "Hamburg"],
        "France": ["Île-de-France", "Provence-Alpes-Côte d'Azur", "Auvergne-Rhône-Alpes"]
    }
    regions = {
        "United States": "North America",
        "Canada": "North America",
        "United Kingdom": "Europe",
        "Germany": "Europe",
        "France": "Europe"
    }
    
    payments = ["Credit Card", "Debit Card", "PayPal", "Apple Pay", "Google Pay"]
    
    data = []
    for i in range(rows):
        cust = np.random.choice(customers)
        name = cust_map[cust]
        cat = np.random.choice(categories)
        prod = np.random.choice(products[cat])
        price = prices[prod]
        qty = int(np.random.choice([1, 2, 3, 4, 5], p=[0.5, 0.25, 0.15, 0.07, 0.03]))
        sales = price * qty
        
        # Add random discount 0-15%
        disc = np.random.choice([0.0, 0.05, 0.10, 0.15], p=[0.6, 0.2, 0.1, 0.1])
        sales_amount = round(sales * (1 - disc), 2)
        
        # Profit margins between 15% and 45%
        margin = np.random.uniform(0.15, 0.45)
        profit = round(sales_amount * margin, 2)
        
        country = np.random.choice(countries)
        state = np.random.choice(states[country])
        region = regions[country]
        payment = np.random.choice(payments)
        
        data.append({
            "Transaction ID": f"TXN-{100000 + i}",
            "Order Date": dates[i].strftime("%Y-%m-%d"),
            "Customer ID": cust,
            "Customer Name": name,
            "Product Category": cat,
            "Product Name": prod,
            "Quantity": qty,
            "Unit Price": price,
            "Discount": disc,
            "Sales Amount": sales_amount,
            "Profit": profit,
            "Payment Method": payment,
            "Country": country,
            "State": state,
            "Region": region
        })
        
    df = pd.DataFrame(data)
    df.to_csv("sample-datasets/retail_sales.csv", index=False)
    df.to_excel("sample-datasets/retail_sales.xlsx", index=False)
    print("Retail Sales generated successfully!")

def generate_ecommerce_sales():
    print("Generating E-commerce dataset...")
    np.random.seed(123)
    rows = 1500
    
    base_date = datetime.today() - timedelta(days=500)
    dates = [base_date + timedelta(days=int(i)) for i in np.random.randint(0, 500, rows)]
    
    customers = [f"C-{2000 + i}" for i in range(200)]
    customer_names = [f"User Name {2000 + i}" for i in range(200)]
    emails = [f"user_{2000 + i}@example.com" for i in range(200)]
    cust_map = {c: (n, e) for c, n, e in zip(customers, customer_names, emails)}
    
    categories = ["Electronics", "Books", "Office Supplies", "Home Decor"]
    products = {
        "Electronics": ["Wireless Mouse", "Keyboard", "USB-C Hub", "Monitor", "Webcam"],
        "Books": ["Fiction Novel", "Sci-Fi Trilogy", "Self-Help Book", "Biography", "Cookbook"],
        "Office Supplies": ["Notebook", "Gel Pens", "Desk Organizer", "Paper Shredder", "Sticky Notes"],
        "Home Decor": ["Desk Lamp", "Wall Art", "Throw Pillow", "Scented Candle", "Indoor Plant"]
    }
    prices = {
        "Wireless Mouse": 29.99, "Keyboard": 49.99, "USB-C Hub": 39.99, "Monitor": 189.99, "Webcam": 59.99,
        "Fiction Novel": 14.99, "Sci-Fi Trilogy": 34.99, "Self-Help Book": 12.99, "Biography": 24.99, "Cookbook": 19.99,
        "Notebook": 8.99, "Gel Pens": 5.99, "Desk Organizer": 19.99, "Paper Shredder": 45.99, "Sticky Notes": 3.99,
        "Desk Lamp": 34.99, "Wall Art": 49.99, "Throw Pillow": 15.99, "Scented Candle": 12.99, "Indoor Plant": 22.99
    }
    
    us_states = ["California", "Texas", "Florida", "New York", "Pennsylvania", "Ohio", "Georgia", "Washington"]
    payments = ["Credit Card", "Debit Card", "PayPal", "Stripe", "Apple Pay"]
    
    data = []
    for i in range(rows):
        cust = np.random.choice(customers)
        name, email = cust_map[cust]
        cat = np.random.choice(categories)
        prod = np.random.choice(products[cat])
        price = prices[prod]
        qty = int(np.random.choice([1, 2, 3], p=[0.7, 0.2, 0.1]))
        sales = price * qty
        disc = np.random.choice([0.0, 0.1, 0.2], p=[0.75, 0.15, 0.1])
        sales_amount = round(sales * (1 - disc), 2)
        profit = round(sales_amount * np.random.uniform(0.2, 0.5), 2)
        
        state = np.random.choice(us_states)
        payment = np.random.choice(payments)
        
        data.append({
            "Order ID": f"ORD-{500000 + i}",
            "Order Date": dates[i].strftime("%Y-%m-%d"),
            "Customer ID": cust,
            "Customer Name": name,
            "Email": email,
            "Product Category": cat,
            "Product Name": prod,
            "Unit Price": price,
            "Quantity": qty,
            "Discount": disc,
            "Sales Amount": sales_amount,
            "Profit": profit,
            "Payment Method": payment,
            "Country": "United States",
            "State": state,
            "Region": "North America"
        })
        
    df = pd.DataFrame(data)
    df.to_csv("sample-datasets/ecommerce_sales.csv", index=False)
    df.to_excel("sample-datasets/ecommerce_sales.xlsx", index=False)
    print("E-commerce Sales generated successfully!")

def generate_superstore():
    print("Generating Superstore dataset...")
    np.random.seed(789)
    rows = 2000
    
    base_date = datetime.today() - timedelta(days=1000)
    dates = [base_date + timedelta(days=int(i)) for i in np.random.randint(0, 1000, rows)]
    
    customers = [f"US-{10000 + i}" for i in range(250)]
    customer_names = [f"S-Customer {i}" for i in range(250)]
    cust_map = dict(zip(customers, customer_names))
    
    segments = ["Consumer", "Corporate", "Home Office"]
    ship_modes = ["Standard Class", "Second Class", "First Class", "Same Day"]
    
    categories = ["Furniture", "Office Supplies", "Technology"]
    subcategories = {
        "Furniture": ["Bookcases", "Chairs", "Tables", "Furnishings"],
        "Office Supplies": ["Appliances", "Art", "Binders", "Paper", "Storage"],
        "Technology": ["Accessories", "Copiers", "Phones", "Machines"]
    }
    products = {
        "Bookcases": "Sauder Bookcase / Bush Bookcase",
        "Chairs": "HON Office Chair / Novimex Executive Chair",
        "Tables": "Basterd Conference Table / O'Sullivan Computer Desk",
        "Furnishings": "Eldon File Cart / Rubbermaid Wastebasket",
        "Appliances": "Kensington Microwave / Hamilton Beach Toaster",
        "Art": "Sharpie Highlighter / Dixon Pencils",
        "Binders": "GBC Ring Binder / Wilson Jones Binders",
        "Paper": "Xerox 1910 / Xerox 2200",
        "Storage": "Tenex Storage Box / Fellowes File Box",
        "Accessories": "Logitech Mouse / SanDisk Flash Drive",
        "Copiers": "Canon Copier / Brother MFC Copier",
        "Phones": "Apple iPhone / Samsung Galaxy",
        "Machines": "HP Laserjet / Epson Label Maker"
    }
    
    regions = ["East", "West", "Central", "South"]
    states = {
        "East": ["New York", "Pennsylvania", "Massachusetts", "Ohio"],
        "West": ["California", "Washington", "Oregon", "Colorado"],
        "Central": ["Texas", "Illinois", "Michigan", "Wisconsin"],
        "South": ["Florida", "North Carolina", "Georgia", "Virginia"]
    }
    
    data = []
    for i in range(rows):
        cust = np.random.choice(customers)
        name = cust_map[cust]
        seg = np.random.choice(segments, p=[0.5, 0.3, 0.2])
        ship = np.random.choice(ship_modes, p=[0.6, 0.2, 0.15, 0.05])
        cat = np.random.choice(categories)
        subcat = np.random.choice(subcategories[cat])
        prod = products[subcat] + " - " + str(np.random.randint(1, 10))
        
        qty = int(np.random.randint(1, 10))
        price = round(np.random.uniform(5.0, 350.0), 2)
        sales = round(price * qty, 2)
        disc = np.random.choice([0.0, 0.1, 0.2, 0.5], p=[0.7, 0.15, 0.1, 0.05])
        sales_amount = round(sales * (1 - disc), 2)
        profit_margin = np.random.uniform(-0.2, 0.5) # Superstore can have negative profit
        profit = round(sales_amount * profit_margin, 2)
        
        region = np.random.choice(regions)
        state = np.random.choice(states[region])
        
        order_dt = dates[i]
        ship_dt = order_dt + timedelta(days=int(np.random.randint(1, 7)))
        
        data.append({
            "Row ID": i + 1,
            "Order ID": f"US-{order_dt.year}-{100000 + i}",
            "Order Date": order_dt.strftime("%Y-%m-%d"),
            "Ship Date": ship_dt.strftime("%Y-%m-%d"),
            "Ship Mode": ship,
            "Customer ID": cust,
            "Customer Name": name,
            "Segment": seg,
            "Country": "United States",
            "City": "Demo City",
            "State": state,
            "Postal Code": f"{np.random.randint(10000, 99999)}",
            "Region": region,
            "Product ID": f"{cat[:3]}-{subcat[:3]}-{10000000 + i}",
            "Category": cat,
            "Sub-Category": subcat,
            "Product Name": prod,
            "Sales": sales_amount,
            "Quantity": qty,
            "Discount": disc,
            "Profit": profit
        })
        
    df = pd.DataFrame(data)
    df.to_csv("sample-datasets/superstore_sales.csv", index=False)
    df.to_excel("sample-datasets/superstore_sales.xlsx", index=False)
    print("Superstore Sales generated successfully!")

def generate_subscription():
    print("Generating Subscription Business dataset...")
    np.random.seed(999)
    rows = 1000
    
    base_date = datetime.today() - timedelta(days=365)
    dates = [base_date + timedelta(days=int(i)) for i in np.random.randint(0, 365, rows)]
    
    plans = ["Basic", "Professional", "Enterprise"]
    fees = {"Basic": 29.00, "Professional": 79.00, "Enterprise": 249.00}
    
    countries = ["United States", "Canada", "United Kingdom", "Australia"]
    
    data = []
    for i in range(rows):
        cust = f"SUB-{3000 + i}"
        name = f"Subscriber {3000 + i}"
        email = f"subscriber_{3000 + i}@gmail.com"
        plan = np.random.choice(plans, p=[0.6, 0.3, 0.1])
        fee = fees[plan]
        signup = dates[i]
        
        # Simulating churn: 20% churned
        is_churned = np.random.choice([True, False], p=[0.2, 0.8])
        if is_churned:
            churn_days = np.random.randint(30, 250)
            churn_dt = signup + timedelta(days=churn_days)
            status = "Churned"
            churn_date_str = churn_dt.strftime("%Y-%m-%d")
        else:
            status = "Active"
            churn_date_str = ""
            
        last_login_days = np.random.randint(0, 45)
        last_login = datetime.today() - timedelta(days=last_login_days)
        logins = np.random.randint(5, 500)
        tickets = np.random.randint(0, 15)
        
        country = np.random.choice(countries)
        
        data.append({
            "Customer ID": cust,
            "Customer Name": name,
            "Email": email,
            "Plan Name": plan,
            "Monthly Fee": fee,
            "Order Date": signup.strftime("%Y-%m-%d"), # mapped as Order Date for standard schema loader
            "Status": status,
            "Churn Date": churn_date_str,
            "Last Login Date": last_login.strftime("%Y-%m-%d"),
            "Total Logins": logins,
            "Support Tickets": tickets,
            "Country": country,
            "Sales Amount": fee,  # mapped to Sales Amount for uniformity
            "Product Name": f"SaaS {plan} Subscription" # mapped to Product Name
        })
        
    df = pd.DataFrame(data)
    df.to_csv("sample-datasets/subscription_business.csv", index=False)
    df.to_excel("sample-datasets/subscription_business.xlsx", index=False)
    print("Subscription Business generated successfully!")

if __name__ == "__main__":
    create_sample_directories()
    generate_retail_sales()
    generate_ecommerce_sales()
    generate_superstore()
    generate_subscription()
