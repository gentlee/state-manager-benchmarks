import { createStore, combineReducers } from 'redux';
import { combineSlices, configureStore, createSlice } from '@reduxjs/toolkit';
import { produce, setAutoFreeze, original } from 'immer';

const initialState = {
  largeArray: Array.from({ length: 10000 }, (_, i) => ({
    id: i,
    value: Math.random(),
    nested: { key: `key-${i}`, data: Math.random() },
    moreNested: { items: Array.from({ length: 100 }, (_, i) => ({ id: i, name: String(i) })) }
  })),
  otherData: Array.from({ length: 10000 }, (_, i) => ({
    id: i,
    name: `name-${i}`,
    isActive: i % 2 === 0,
  })),
}

const vanillaReducer = (state = initialState, action) => {
  switch (action.type) {
    case 'test/addItem':
      return {
        ...state,
        largeArray: [...state.largeArray, action.payload],
      };
    case 'test/removeItem':
      return {
        ...state,
        largeArray: state.largeArray.filter((_, i) => i !== action.payload),
      };
    case 'test/updateItem':
      return {
        ...state,
        largeArray: state.largeArray.map(item =>
          item.id === action.payload.id
            ? { ...item, value: action.payload.value, nested: { ...item.nested, data: action.payload.nestedData } }
            : item
        ),
      };
    case 'test/concatArray':
      const newArray = action.payload.concat(state.largeArray);
      newArray.length = initialState.largeArray.length
      return {
        ...state,
        largeArray: newArray
      }
    default:
      return state;
  }
};

const { reducer: immerReducer } = createSlice({
  name: 'test',
  initialState,
  reducers: {
    addItem: (state, action) => {
      state.largeArray.push(action.payload);
    },
    removeItem: (state, action) => {
      state.largeArray.splice(action.payload, 1);
    },
    updateItem: (state, action) => {
      const item = state.largeArray.find(item => item.id === action.payload.id);
      item.value = action.payload.value;
      item.nested.data = action.payload.nestedData;
    },
    concatArray: (state, action) => {
      state.largeArray.unshift(...action.payload)
      state.largeArray.length = initialState.largeArray.length
    },
  }
})

const { reducer: immerReducerImmutable } = createSlice({
  name: 'test',
  initialState,
  reducers: {
    addItem: (state, action) => {
      const originalState = original(state);
      return {
        ...state,
        largeArray: [...originalState.largeArray, action.payload],
      };
    },
    removeItem: (state, action) => {
      const originalState = original(state);
      return {
        ...state,
        largeArray: originalState.largeArray.filter((_, i) => i !== action.payload),
      };
    },
    updateItem: (state, action) => {
      const originalState = original(state);
      return {
        ...state,
        largeArray: originalState.largeArray.map(item =>
          item.id === action.payload.id
            ? { ...item, value: action.payload.value, nested: { ...item.nested, data: action.payload.nestedData } }
            : item
        ),
      };
    },
    concatArray: (state, action) => {
      const originalState = original(state);
      const newArray = action.payload.concat(originalState.largeArray);
      newArray.length = initialState.largeArray.length
      return {
        ...state,
        largeArray: newArray
      }
    },
  }
})

function benchmark(name, setupFn, runFn, warmupCount = 100, runCount = 5000) {
  // Setup

  const store = setupFn();

  // Warmup

  for (let i = 0; i < warmupCount; i++) {
    runFn(store, i);
  }

  global?.gc()

  // Measurement

  const start = performance.now();
  for (let i = 0; i < runCount; i++) {
    runFn(store, i);
  }
  const end = performance.now();

  console.log(`${name}: ${(end - start).toFixed(2)}`);

  global?.gc()
}

const add = (index) => ({ type: 'test/addItem', payload: { id: index, value: index, nested: { data: index } } });
const remove = (index) => ({ type: 'test/removeItem', payload: index });
const update = (index) => ({ type: 'test/updateItem', payload: { id: index, value: index, nestedData: index } });
const concat = (index) => ({ type: 'test/concatArray', payload: Array.from({ length: 500 }, (_, i) => ({ id: i, value: index })) });

console.log('Starting benchmarks...');

benchmark(
  'Add Item',
  () => {
    return createStore(vanillaReducer);
  },
  (store, index) => store.dispatch(add(index))
);

benchmark(
  'Add Item [Immer]',
  () => {
    setAutoFreeze(true);
    return configureStore({
      reducer: immerReducer
    });
  },
  (store, index) => store.dispatch(add(index))
);

benchmark(
  'Add Item [Immer NoAutoFreeze]',
  () => {
    setAutoFreeze(false);
    return configureStore({
      reducer: immerReducer
    });
  },
  (store, index) => store.dispatch(add(index))
);

benchmark(
  'Add Item [Immer Immutable]',
  () => {
    setAutoFreeze(true);
    return configureStore({
      reducer: immerReducerImmutable
    });
  },
  (store, index) => store.dispatch(add(index))
);

benchmark(
  'Add Item [Immer Immutable NoAutoFreeze]',
  () => {
    setAutoFreeze(false);
    return configureStore({
      reducer: immerReducerImmutable
    });
  },
  (store, index) => store.dispatch(add(index))
);

benchmark(
  'Remove Item',
  () => {
    setAutoFreeze(false);
    return createStore(vanillaReducer);
  },
  (store, index) => store.dispatch(remove(index))
);

benchmark(
  'Remove Item [Immer]',
  () => {
    setAutoFreeze(true);
    return configureStore({
      reducer: immerReducer
    });
  },
  (store, index) => store.dispatch(remove(index))
);

benchmark(
  'Remove Item [Immer NoAutoFreeze]',
  () => {
    setAutoFreeze(false);
    return configureStore({
      reducer: immerReducer
    });
  },
  (store, index) => store.dispatch(remove(index))
);

benchmark(
  'Remove Item [Immer Immutable]',
  () => {
    setAutoFreeze(true);
    return configureStore({
      reducer: immerReducerImmutable
    });
  },
  (store, index) => store.dispatch(remove(index))
);

benchmark(
  'Remove Item [Immer Immutable NoAutoFreeze]',
  () => {
    setAutoFreeze(false);
    return configureStore({
      reducer: immerReducerImmutable
    });
  },
  (store, index) => store.dispatch(remove(index))
);

benchmark(
  'Update Item',
  () => {
    return createStore(vanillaReducer);
  },
  (store, index) => store.dispatch(update(index))
);

benchmark(
  'Update Item [Immer]',
  () => {
    setAutoFreeze(true);
    return configureStore({
      reducer: immerReducer
    });
  },
  (store, index) => store.dispatch(update(index))
);

benchmark(
  'Update Item [Immer NoAutoFreeze]',
  () => {
    setAutoFreeze(false);
    return configureStore({
      reducer: immerReducer
    });
  },
  (store, index) => store.dispatch(update(index))
);

benchmark(
  'Update Item [Immer Immutable]',
  () => {
    setAutoFreeze(true);
    return configureStore({
      reducer: immerReducerImmutable
    });
  },
  (store, index) => store.dispatch(update(index))
);

benchmark(
  'Update Item [Immer Immutable NoAutoFreeze]',
  () => {
    setAutoFreeze(false);
    return configureStore({
      reducer: immerReducerImmutable
    });
  },
  (store, index) => store.dispatch(update(index))
);

benchmark(
  'Concat Array',
  () => {
    return createStore(vanillaReducer);
  },
  (store, index) => store.dispatch(concat(index))
);

benchmark(
  'Concat Array [Immer]',
  () => {
    setAutoFreeze(true);
    return configureStore({
      reducer: immerReducer
    });
  },
  (store, index) => store.dispatch(concat(index))
);

benchmark(
  'Concat Array [Immer NoAutoFreeze]',
  () => {
    setAutoFreeze(false);
    return configureStore({
      reducer: immerReducer
    });
  },
  (store, index) => store.dispatch(concat(index))
);

benchmark(
  'Concat Array [Immer Immutable]',
  () => {
    setAutoFreeze(true);
    return configureStore({
      reducer: immerReducerImmutable
    });
  },
  (store, index) => store.dispatch(concat(index))
);

benchmark(
  'Concat Array [Immer Immutable NoAutoFreeze]',
  () => {
    setAutoFreeze(false);
    return configureStore({
      reducer: immerReducerImmutable
    });
  },
  (store, index) => store.dispatch(concat(index))
);
