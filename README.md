Current benchmark is only for **RTK reducers (no immer) vs RTK slices (with immer)**.

Install with `npm i`

Run with `npm start`

### Results (x times slower - the lower, the better)

How to read: Remove operation for RTK with immer (slices) is at averate by 87.5 slower than RTK with vanilla redux reducers.

#### @reduxjs/toolkit: 2.10.1, immer: 10.2.0

||no-immer|immer|immer no-auto-freeze|immer-immutable|immer-immutable no-auto-freeze|
|-|-|-|-|-|-|
|add|1.0|35.7|22.4|16.9|35.6|
|remove|1.0|87.1|83.2|5.4|2.9|
|update|1.0|9.1|5.9|3.2|6.1|
|concat|1.0|388.7|372.0|16.0|104.5|
|[average]|1.0|87.5|81.7|6.5|18.1|

#### @reduxjs/toolkit: 2.5.0, immer: 10.1.1

||no-immer|immer|immer no-auto-freeze|immer-immutable|immer-immutable no-auto-freeze|
|-|-|-|-|-|-|
|add|1.0|146.3|127.3|128.6|178.9|
|remove|1.0|85.7|81.9|21.2|18.4|
|update|1.0|25.7|22.5|20.9|28.2|
|concat|1.0|386.0|369.8|82.0|271.7|
|[average]|1.0|100.9|94.8|35.2|62.3|
