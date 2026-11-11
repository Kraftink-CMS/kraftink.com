# Track site and server statistics

Install **Statistics** from **Plugins**, then open **Extensions → Statistics**. The **View statistics** permission grants access to this panel.

Choose a preset period or enter custom dates. Comparison overlays the previous period of the same length when it is still available. Hover over a chart or use its slider to read the values for a specific date. The CSV exports daily figures for the selected period and server.

## Website audience

The charts show page views, daily visitors and new registrations. Open the audience details to see views by guests and signed-in members. A visitor counts once per session per day, so the same session can count again on another day. The most viewed sections group pages by public route, such as all news articles.

Breakdowns show browsers, major browser versions, operating systems and external referral domains. The plugin skips known bots, keeps aggregate counters and uses the existing KraftInk session. It adds no cookies and stores no IP address, member ID, full URL or raw user agent. Counting starts when you enable the plugin and covers public pages served by KraftInk.

## Game servers

Enable the [scheduler](operations.md#scheduler) to collect samples every five minutes. A ping connection is enough to track player counts when the server reports them. KraftLink is optional and can also report Java heap usage and TPS, depending on the platform.

The CPU chart is available with Statistics 1.0.2 and KraftLink 1.5.0 or later compatible versions. It shows how much CPU the Java process running KraftLink uses when the Java runtime provides that measurement.

The charts show peaks for players, memory and CPU, plus average TPS. A one-day period shows hourly figures. A dash marks an unavailable measurement. The sample count helps you interpret partial periods.

Periods use UTC. Set the retention period under **Operations → Data retention → Old deliveries and tasks, in days**.
