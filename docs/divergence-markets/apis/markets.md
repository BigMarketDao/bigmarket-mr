# Polymarket

See (markets)[https://docs.polymarket.com/market-data/fetching-markets]

## Get Markets

```curl
curl "https://gamma-api.polymarket.com/events?active=true&closed=false&limit=100"
```

Key Parameters
Parameter Description
order Field to order by (volume_24hr, volume, liquidity, start_date, end_date, competitive, closed_time)
ascending Sort direction (true for ascending, false for descending). Default: false
active Filter by active status (true for live tradable events)
closed Filter by closed status. Default: false
limit Results per page
offset Number of results to skip for pagination

### Get the highest volume active events

curl "https://gamma-api.polymarket.com/events?active=true&closed=false&order=volume_24hr&ascending=false&limit=100"

# Kalshi

See (markets)[https://docs.kalshi.com/api-reference/market/get-markets]

Filter by market status. Possible values: unopened, open, closed, settled. Leave empty to return markets with any status.# Kalshi

## Get Markets

```curl
curl --request GET \
  --url 'https://external-api.kalshi.com/trade-api/v2/markets?limit=100'
```

Filter by market status. Possible values: unopened, open, closed, settled. Leave empty to return markets with any status.

Only one status filter may be supplied at a time.
Timestamp filters will be mutually exclusive from other timestamp filters and certain status filters.
Compatible Timestamp Filters Additional Status Filters Extra Notes
min_created_ts, max_created_ts unopened, open, empty
min_close_ts, max_close_ts closed, empty
min_settled_ts, max_settled_ts settled, empty
min_updated_ts empty Incompatible with all filters besides mve_filter=exclude. May be combined with series_ticker, which requires mve_filter=exclude
Markets that settled before the historical cutoff are only available via GET /historical/markets. See Historical Data for details.

GET

https://external-api.kalshi.com/trade-api/v2
/
markets

Try it
Query Parameters
​
limit
integer<int64>default:100
Number of results per page. Defaults to 100. Maximum value is 1000.

Required range: 0 <= x <= 1000
​
cursor
string
Pagination cursor. Use the cursor value returned from the previous response to get the next page of results. Leave empty for the first page.

​
event_ticker
string
Event ticker to filter by. Only a single event ticker is supported.

​
series_ticker
string
Filter by series ticker

​
min_created_ts
integer<int64>
Filter items that created after this Unix timestamp

​
max_created_ts
integer<int64>
Filter items that created before this Unix timestamp

​
min_updated_ts
integer<int64>
Return markets with metadata updated later than this Unix timestamp. Tracks non-trading changes only. Incompatible with any other filters except mve_filter=exclude. May be combined with series_ticker, which requires mve_filter=exclude.

​
max_close_ts
integer<int64>
Filter items that close before this Unix timestamp

​
min_close_ts
integer<int64>
Filter items that close after this Unix timestamp

​
min_settled_ts
integer<int64>
Filter items that settled after this Unix timestamp

​
max_settled_ts
integer<int64>
Filter items that settled before this Unix timestamp

​
status
enum<string>
Filter by market status. Leave empty to return markets with any status.

Available options: unopened, open, paused, closed, settled
​
tickers
string
Filter by specific market tickers. Comma-separated list of market tickers to retrieve.

​
mve_filter
enum<string>
Filter by multivariate events (combos). 'only' returns only multivariate events, 'exclude' excludes multivariate events.

Available options: only, exclude
Response

200

application/json
Markets retrieved successfully

​
markets
object[]required
Show child attributes

​
cursor
stringrequired
