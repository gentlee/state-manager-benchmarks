Current benchmark is only for **Redux vs RTK**.

Install with `npm i`

Run with `npm start`

### Results

"@reduxjs/toolkit": "2.10.1"
"immer": "10.2.0"

||no-immer|immer|immer no-auto-freeze|immer-immutable|immer-immutable no-auto-freeze|
|-|-|-|-|-|-|
|add|1.0|35.7|22.4|16.9|35.6|
|remove|1.0|87.1|83.2|5.4|2.9|
|update|1.0|9.1|5.9|3.2|6.1|
|concat|1.0|388.7|372.0|16.0|104.5|
|[average]|1.0|87.5|81.7|6.5|18.1|
