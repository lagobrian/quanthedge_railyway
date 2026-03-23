## Updates for Quant (h)Edge Website

1. Post reactions don't just have to be likes, they can be a smogasboard like on discord.

2. If possible,download all the data from the 'shop-talk' channel on the Quant (h)Edge trading discord and make a discord-like lounge to continue, or post them as another newsletter for daily market commentary. Quant (h)Edge Daily Dossier has a nice ring to it. 

3. Maybe use docker and kubernetes.

4. All backtests to have a uniform format that. Since I normally do backtests in VectorBT, they will look the same. What I need is each backtest to be presented in a dashboard where a user can click on dropdowns to select the instrument, the metrics, and other such things to see the results. Maybe I need to share some of the backtests I've done so we can plan how that looks. Once a backtest is done (in the same format more or less, on a jupyter notebook), there should be a script to push the results to a table in the DB and then the results can be published on the website, along with a post explaining the backtest methodology, parameters and their intuition, and how the backtests are applicable for trading (the 'Edge' or 'Hedge' insights). https://quanthedge.substack.com/p/your-new-best-friend-in-crypto-trading

5. Improve the aesthetics of the comment section, drawing inspiration from Substack. 
![Alt text]("C:\Users\LagoB\Desktop\Money\Substack comment section.png" "a title")

6. There should be a system that sends automatic email updates for models that a user can select ('Get email notifications for this model' check box, and they choose the frequency and timing, or how much of a change it, or what condition has to be fulfilled for a notification to be sent i.e. if the crypto breadth (pct of coins above 50dma crosses above/below 20% which is a crucial indicator from my backtests)

7. Add social media signup options and options to sign up with crypto techniques.. basically make it easy to sign up using virtually all straightforward techniques.

8. [Bug] When you subscribe for the newsletter, it should say thanks for subscribing and get rid of the card. 

9. I should have dashboards for models and backtests (if a user is identified as an analyst, and even then, only for the models and backtests they worked on), so that they can edit some of the writing on the pages for these models/backtests. For instance, each model should have a section right under the chart that says what the model is, what it shows and how it can be used to make money, along with a table with results of the long/short conditions and the results after certain intervals. i.e. in the crypto breadth model, if Pct of coins above 50dma goes back above 20% after spending some time below it, then you have a bullish signal for crypto. A table should show results after 1 day, 2 days, 3 days, 5 days, 1 week, 2 weeks, 1 month, 3 months, 1 yr, 2yrs, etc
but these frequencies can depend on the model. Some models give hourly frequencies, some days and weeks, some years. Should be possible to configure the table from dashboard. 

10. I wish for a much more richer editor like the one used by substack, beehiv, notion and ghost. 
11. I should be able to post an ad section in posts, either on top, or below, or at some place in the middle. This is a section where a specific sponsored add is placed, and it can be html embedding. 
12. I should be able to generate discount codes and trial periods.
13. Ensure that premium members can see paywalled posts, and don't see any padlock icons after logging in, or show an unlocked padlock icon to show they are 'in'.
14. The current front page should be an 'about page'. The actual front page should be a dashboard. I don't know how to design it yet, but it should incorporate tradingview charts, and then selected models by the user. A common feature should be a watchlist of tickers in a table showing real-time movements. The idea is that when someone visits quanthedge, they can hang around without having to go elsewhere to check markets. 
15. There should be a standardized way of making the models in the backend. We are using django. I need guidance on how to make a model and post it to the site. I already have several that I want to include. 
16. I also need guidance on how to set up certain cronjobs to fetch data specific sources and add the data to a database. 
17.  I need to make a copy of the production database in localhost using postgres and pgadmin so I can see what it looks like at all times. 
18.  My local copy should be the exact same as the one on github and the site should work locally as it does on github. If I need to set up the local server in a different way,say using docker and kubernetes it's fine. 
19. Is Digital option a better place to host, maybe cheaper, or AWS. I need it to be always on. 
20. A product that we will offer are bot funds which are ai agents or trading bots that automatically apply our models and backtests to markets and either make or lose money. Users can join a fund for as little as $100 and withdraw at any time after a certain lock period to prevent constant changes to the base capital. This will come later. 
21. Certain parts of the site need to be ultra-fast, even if it means changing things to rust. I need a brief doc of how to optimize the real-time data feeds for speed, and how I can use other ways/languages/stacks to make things like bot funds super fast. 
22. There should be a bot that gives updates on twitter for specific charts with a text. 'Crypto breadth is atrocious today! ' then the chart. 
23. Rename the blog section to Newsletters. 
24. The website should look good on all devices. 
25. I need a document explaining the way the website was made and the stacks because I will learn all the languages and stacks so I can manually make changes if needed. This master doc can be given to any ai or developer and they would understand the site.
26. We should have an API that gives our data to those who subscribe to it. Members can make API keys and the rate limits depend on the paid tier. 
27. Each model should use the highest granularity data possible across the board. Remember, there are always services and cron jobs to update the database so we can store data at a high level of granularity.
28. There is currently no email verification during sign up. 
29. Add 2FA
30. Users should be prompted for profile completion.
31. Cards urging members to subscribe should never be shown to anyone who has subscribed already (premium members). 
32. There should be a placeholder image for subscribers, and default anonymous usernames with financial meanings i.e. oil_buffet, druckenmiller's_nemesis etc funny stuff. 
33. The font selection and spacing of the blog should be readable, and posts should say how long it takes to read them. 
34. Fallbacks and rollbacks on always. 
