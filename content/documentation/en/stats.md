# Track site and server statistics

Install **Statistics** from **Plugins**, then open **Extensions → Statistics**. The **View statistics** permission grants access to this panel.

Choose a preset period or enter custom dates. Comparison overlays the previous period of the same length when it is still available. Hover over a chart or use its slider to read the values for a specific date. The CSV exports daily figures for the selected period and server.

## Website audience

The charts show page views, daily visitors and new registrations. Open the audience details to see views by guests and signed-in members. A visitor counts once per session per day, so the same session can count again on another day. The most viewed sections group pages by public route, such as all news articles.

Breakdowns show browsers, major browser versions, operating systems and external referral domains. The plugin skips known bots, keeps aggregate counters and uses the existing KraftInk session. It adds no cookies and stores no IP address, member ID, full URL or raw user agent. Counting starts when you enable the plugin and covers requests that reach KraftInk.

## Game servers

Enable the [scheduler](operations.md#scheduler) to collect samples every five minutes. Select a server to track player counts and, when the connection provides them, process CPU use, memory use and TPS. A server that responds to a ping can report its player count. With KraftLink, CPU and memory readings depend on the installed connector and Java environment. CPU covers the process and memory covers the Java heap.

The charts show peaks for players, CPU and memory, plus average TPS. A one-day period shows hourly figures. A dash marks an unavailable measurement. The sample count helps you interpret partial periods.

Periods use UTC. Retention follows the **technical records** setting under **Operations → Data retention**.
