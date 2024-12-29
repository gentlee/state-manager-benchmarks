import {configureStore, createSlice} from '@reduxjs/toolkit'
import {original, setAutoFreeze} from 'immer'
import {performance} from 'perf_hooks'

const initialState = {
  array: Array.from({length: 10000}, (_, i) => ({
    id: i,
    value: Math.random(),
    nested: {key: `key-${i}`, value: Math.random()},
  })),
}

const actions = {
  add: (index) => ({
    type: 'test/addItem',
    payload: {id: index, value: index, nested: {key: `key-${index}`, value: index}},
  }),
  remove: (index) => ({type: 'test/removeItem', payload: index}),
  update: (index) => ({
    type: 'test/updateItem',
    payload: {id: index, value: Math.random(), nestedValue: Math.random()},
  }),
  concat: (index) => ({
    type: 'test/concatArray',
    payload: Array.from({length: 500}, (_, i) => ({id: i, value: index})),
  }),
}

const reducers = {
  'no-immer': (state = initialState, action) => {
    switch (action.type) {
      case 'test/addItem':
        return {
          ...state,
          array: [...state.array, action.payload],
        }
      case 'test/removeItem':
        return {
          ...state,
          array: state.array.filter((_, i) => i !== action.payload),
        }
      case 'test/updateItem':
        return {
          ...state,
          array: state.array.map((item) =>
            item.id === action.payload.id
              ? {
                  ...item,
                  value: action.payload.value,
                  nested: {...item.nested, value: action.payload.nestedValue},
                }
              : item
          ),
        }
      case 'test/concatArray': {
        const newArray = action.payload.concat(state.array)
        newArray.length = initialState.array.length
        return {
          ...state,
          array: newArray,
        }
      }
      default:
        return state
    }
  },
  immer: createSlice({
    name: 'test',
    initialState,
    reducers: {
      addItem: (state, action) => {
        state.array.push(action.payload)
      },
      removeItem: (state, action) => {
        state.array.splice(action.payload, 1)
      },
      updateItem: (state, action) => {
        const item = state.array.find((item) => item.id === action.payload.id)
        item.value = action.payload.value
        item.nested.value = action.payload.nestedValue
      },
      concatArray: (state, action) => {
        state.array.unshift(...action.payload)
        state.array.length = initialState.array.length
      },
    },
  }).reducer,
  'immer-immutable': createSlice({
    name: 'test',
    initialState,
    reducers: {
      addItem: (state, action) => {
        return {
          ...state,
          array: [...original(state).array, action.payload],
        }
      },
      removeItem: (state, action) => {
        return {
          ...state,
          array: original(state).array.filter((_, i) => i !== action.payload),
        }
      },
      updateItem: (state, action) => {
        return {
          ...state,
          array: original(state).array.map((item) =>
            item.id === action.payload.id
              ? {
                  ...item,
                  value: action.payload.value,
                  nested: {...item.nested, value: action.payload.nestedValue},
                }
              : item
          ),
        }
      },
      concatArray: (state, action) => {
        const newArray = action.payload.concat(original(state).array)
        newArray.length = initialState.array.length
        return {
          ...state,
          array: newArray,
        }
      },
    },
  }).reducer,
}

const results = {}

/**
 * @param {string} actionKey
 * @param {keyof typeof reducers} reducerKey
 * @param {boolean} autoFreeze
 */
const benchmark = (actionKey, reducerKey, autoFreeze = true) => {
  {
    // Setup

    setAutoFreeze(autoFreeze)
    const warmupCount = 100
    const runCount = 1000
    const action = actions[actionKey]
    const store = configureStore({reducer: reducers[reducerKey]})
    const run = (store, index) => store.dispatch(action(index))

    // Warmup

    for (let i = 0; i < warmupCount; i += 1) {
      run(store, i)
    }

    globalThis.gc()

    // Measurement

    const start = performance.now()
    for (let i = 0; i < runCount; i += 1) {
      run(store, i)
    }
    const end = performance.now()

    // Log results

    const variant = `${reducerKey}${autoFreeze ? '' : ' no-auto-freeze'}`
    const result = (end - start) / runCount
    results[actionKey] ??= {}
    results[actionKey][variant] = result
    console.log(`${actionKey} [${variant}]: ${result.toFixed(4)} ms`)
  }

  globalThis.gc()
}

console.log(`      _             _   _               _                     _                          _        
     | |           | | (_)             | |                   | |                        | |       
  ___| |_ __ _ _ __| |_ _ _ __   __ _  | |__   ___ _ __   ___| |__  _ __ ___   __ _ _ __| | _____ 
 / __| __/ _\` | '__| __| | '_ \\ / _\` | | '_ \\ / _ \\ '_ \\ / __| '_ \\| '_ \` _ \\ / _\` | '__| |/ / __|
 \\__ \\ || (_| | |  | |_| | | | | (_| | | |_) |  __/ | | | (__| | | | | | | | | (_| | |  |   <\\__ \\
 |___/\\__\\__,_|_|   \\__|_|_| |_|\\__, | |_.__/ \\___|_| |_|\\___|_| |_|_| |_| |_|\\__,_|_|  |_|\\_\\___/
                                 __/ |                                                            
                                |___/                                                             
`)

for (let actionKey in actions) {
  benchmark(actionKey, 'no-immer')
  benchmark(actionKey, 'immer')
  benchmark(actionKey, 'immer', false)
  benchmark(actionKey, 'immer-immutable')
  benchmark(actionKey, 'immer-immutable', false)
}

console.table(results)

console.log('markdown (x times slower):')
console.log('||' + Object.keys(results.add).join('|') + '|')
console.log(
  '|-|' +
    Object.keys(results.add)
      .map(() => '-')
      .join('|') +
    '|'
)
for (const action in results) {
  console.log(
    `|${action}|${Object.values(results[action])
      .map((value) => (value / results[action]['no-immer']).toFixed(1))
      .join('|')}|`
  )
}
