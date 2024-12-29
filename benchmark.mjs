import {configureStore, createSlice} from '@reduxjs/toolkit'
import {original, setAutoFreeze} from 'immer'
import {performance} from 'perf_hooks'

const initialState = {
  array: Array.from({length: 10000}, (_, i) => ({
    id: i,
    value: Math.random(),
    nested: {key: `key-${i}`, data: Math.random()},
    moreNested: {items: Array.from({length: 100}, (_, i) => ({id: i, name: String(i)}))},
  })),
  otherData: Array.from({length: 10000}, (_, i) => ({
    id: i,
    name: `name-${i}`,
    isActive: i % 2 === 0,
  })),
}

const actions = {
  add: (index) => ({type: 'test/addItem', payload: {id: index, value: index, nested: {data: index}}}),
  remove: (index) => ({type: 'test/removeItem', payload: index}),
  update: (index) => ({type: 'test/updateItem', payload: {id: index, value: index, nestedData: index}}),
  concat: (index) => ({
    type: 'test/concatArray',
    payload: Array.from({length: 500}, (_, i) => ({id: i, value: index})),
  }),
}

const results = {}

const vanillaReducer = (state = initialState, action) => {
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
                nested: {...item.nested, data: action.payload.nestedData},
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
}

const {reducer: immerReducer} = createSlice({
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
      item.nested.data = action.payload.nestedData
    },
    concatArray: (state, action) => {
      state.array.unshift(...action.payload)
      state.array.length = initialState.array.length
    },
  },
})

const {reducer: immerReducerImmutable} = createSlice({
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
                nested: {...item.nested, data: action.payload.nestedData},
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
})

/**
 * @param {keyof typeof actions} actionKey
 * @param {'no-immer' | 'immer' | 'immer no-auto-freeze' | 'immer immutable' | 'immer immutable no-auto-freeze'} variant
 * @param {() => import('redux').Store} setupFn
 */
function benchmark(actionKey, variant, setupFn) {
  // Setup

  const warmupCount = 100
  const runCount = 1000
  const store = setupFn()
  const action = actions[actionKey]
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

  const result = (end - start) / runCount
  results[actionKey] ??= {}
  results[actionKey][variant] = result
  console.log(`${actionKey} [${variant}]: ${result.toFixed(4)} ms`)

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

benchmark('add', 'no-immer', () => {
  return configureStore({reducer: vanillaReducer})
})

benchmark('add', 'immer', () => {
  setAutoFreeze(true)
  return configureStore({reducer: immerReducer})
})

benchmark('add', 'immer no-auto-freeze', () => {
  setAutoFreeze(false)
  return configureStore({reducer: immerReducer})
})

benchmark('add', 'immer immutable', () => {
  setAutoFreeze(true)
  return configureStore({reducer: immerReducerImmutable})
})

benchmark('add', 'immer immutable no-auto-freeze', () => {
  setAutoFreeze(false)
  return configureStore({reducer: immerReducerImmutable})
})

benchmark('remove', 'no-immer', () => {
  return configureStore({reducer: vanillaReducer})
})

benchmark('remove', 'immer', () => {
  setAutoFreeze(true)
  return configureStore({reducer: immerReducer})
})

benchmark('remove', 'immer no-auto-freeze', () => {
  setAutoFreeze(false)
  return configureStore({reducer: immerReducer})
})

benchmark('remove', 'immer immutable', () => {
  setAutoFreeze(true)
  return configureStore({reducer: immerReducerImmutable})
})

benchmark('remove', 'immer immutable no-auto-freeze', () => {
  setAutoFreeze(false)
  return configureStore({reducer: immerReducerImmutable})
})

benchmark('update', 'no-immer', () => {
  return configureStore({reducer: vanillaReducer})
})

benchmark('update', 'immer', () => {
  setAutoFreeze(true)
  return configureStore({reducer: immerReducer})
})

benchmark('update', 'immer no-auto-freeze', () => {
  setAutoFreeze(false)
  return configureStore({reducer: immerReducer})
})

benchmark('update', 'immer immutable', () => {
  setAutoFreeze(true)
  return configureStore({reducer: immerReducerImmutable})
})

benchmark('update', 'immer immutable no-auto-freeze', () => {
  setAutoFreeze(false)
  return configureStore({reducer: immerReducerImmutable})
})

benchmark('concat', 'no-immer', () => {
  return configureStore({reducer: vanillaReducer})
})

benchmark('concat', 'immer', () => {
  setAutoFreeze(true)
  return configureStore({reducer: immerReducer})
})

benchmark('concat', 'immer no-auto-freeze', () => {
  setAutoFreeze(false)
  return configureStore({reducer: immerReducer})
})

benchmark('concat', 'immer immutable', () => {
  setAutoFreeze(true)
  return configureStore({reducer: immerReducerImmutable})
})

benchmark('concat', 'immer immutable no-auto-freeze', () => {
  setAutoFreeze(false)
  return configureStore({reducer: immerReducerImmutable})
})

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
