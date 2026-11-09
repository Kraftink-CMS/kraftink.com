# Track site and server statistics

Install **Statistics** from **Plugins**, then open **Extensions → Statistics**. The **View statistics** permission grants access to this panel.

The charts separate public page views by guests and signed-in members. Opening several pages or refreshing the same page adds several views. The plugin stores no IP address, member ID or page URL. Counting starts when you enable the plugin and covers requests that reach KraftInk.

Enable the [scheduler](operations.md#scheduler) to collect server samples every five minutes. Select a server to view its peak player count, average TPS and peak memory use. These numbers depend on the recent measurements the server reports. A dash indicates a missing value. The sample count helps you interpret partial days.

Days are grouped in UTC. Retention follows the **technical records** setting under **Operations → Data retention**.
