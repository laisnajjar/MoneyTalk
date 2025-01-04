# MoneyTalk 💬💰  

**MoneyTalk** is a personal finance app that simplifies tracking and managing your expenses. By leveraging third-party APIs, it connects securely to your bank accounts and delivers daily transaction summaries via text, helping you stay on top of your finances with minimal effort.  

## Key Features  
- **Daily Transaction Summaries:** Receive a concise breakdown of your daily spending via SMS.  
- **Seamless Bank Integration:** Connect your bank accounts securely using Plaid or similar APIs.  
- **Spending Insights (Coming Soon):** Get tailored insights on your spending habits, with suggestions to optimize your budget.  

## Technology Stack  
- **Frontend:** React, TypeScript  
- **Backend:** Node.js, Express, Redis (for caching and pub/sub)  
- **Database:** Firebase  
- **APIs:** Plaid for banking integration, Notifyre for SMS notifications  
- **Deployment:** Vercel

## How It Works  
1. **Sign Up and Connect Your Bank Account:**  
   Users sign in securely via Google and connect their bank account using Plaid.  
   
2. **Set Spending Thresholds:**  
   Define daily, weekly, or monthly spending limits.  

3. **Receive Transaction Summaries:**  
   Get nightly SMS alerts summarizing your spending, with plans to include insights and suggestions for better money management.  

## Installation and Setup  
1. Clone the repository:  
   ```bash  
   git clone https://github.com/username/MoneyTalk.git  
