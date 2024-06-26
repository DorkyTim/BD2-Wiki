import { get, set, del } from 'idb-keyval'
import {
	persist,
	createJSONStorage,
	type PersistOptions,
} from 'zustand/middleware'
import {
	type UseBoundStore,
	type StoreApi,
	type StateCreator,
	create,
} from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { Draft } from 'immer'

type Hydration = {
	hydrated: boolean
	setHydrated: () => void
	reset: () => void
}

type Reset = {
	reset: () => void
}

export const persistent = <T extends { [s: string]: unknown }>(
	{
		// change this value to reset indexed db
		version = 21,
		name,
		keysToPersist,
	}: {
		version?: number
		name: string
		keysToPersist: (keyof T)[]
	},
	initializer: StateCreator<
		T & Reset,
		[['zustand/persist', unknown], ['zustand/immer', never]]
	>
): UseBoundStore<
	WithImmer<
		Write<
			StoreApi<T & Hydration & Reset>,
			StorePersist<T & Hydration & Reset, unknown>
		>
	>
> =>
	create<
		T & Hydration & Reset,
		[['zustand/persist', unknown], ['zustand/immer', never]]
	>(
		persist(
			immer((set, get, store) => ({
				hydrated: false satisfies boolean,
				setHydrated: () => {
					set({ hydrated: true } as Partial<T & Hydration>)
				},
				...initializer(
					// @ts-expect-error ...
					set,
					get,
					store
				),
			})),
			{
				version,
				name,
				onRehydrateStorage: state => {
					// * need delay(minimum delay is enough) because we cannot use `set` immediately after rehydrate
					// * even if the `set` is successfully called, the data might be empty, this is probably because redux-persist does not work well with idb-keyval. This problem require longer delay to mitigate. This only happen if you reload video chats page, but is ok if you paste video chats link, weird.
					// TODO solve this permanently
					setTimeout(() => {
						state.setHydrated()
					}, 2000)
				},
				migrate: (persistedState, ver) => {
					if (ver !== version) {
						return {} as T & Hydration
					}
					return persistedState as T & Hydration
				},
				partialize: state =>
					Object.fromEntries(
						Object.entries(state).filter(([key]) => keysToPersist.includes(key))
					),
				// https://blog.muvon.io/frontend/starting-with-zustand
				storage: createJSONStorage(() => ({
					getItem: async (name: string): Promise<string | null> => {
						return (await get(name)) || null
					},
					setItem: (name: string, value: string): Promise<void> => {
						return set(name, value)
					},
					removeItem: (name: string): Promise<void> => {
						return del(name)
					},
				})),
			}
		)
	)

export const ArrayBufferToDataURL = (
	arrayBuffer: ArrayBuffer,
	mime: string
) => {
	let binary = ''
	const bytes = new Uint8Array(arrayBuffer)
	for (let i = 0; i < bytes.byteLength; i++) {
		binary += String.fromCharCode(bytes[i]!)
	}
	return `data:${mime};base64,` + btoa(binary)
}

export const dataURLToObjectURL = (dataURL: string) => {
	const parts = dataURL.split(',')
	const mimeType = parts[0]?.match(/:(.*?);/)?.[1]
	if (!mimeType) throw 'no mime type'
	if (!parts[1]) throw 'no base64string'
	const base64String = atob(parts[1])
	const binaryData = new Uint8Array(base64String.length)

	for (let i = 0; i < base64String.length; i++) {
		binaryData[i] = base64String.charCodeAt(i)
	}

	return URL.createObjectURL(new Blob([binaryData], { type: mimeType }))
}

export type Status = { status: 'error' | 'ok' | 'loading' }

export type ScrollFetchStatus = 'loading' | 'ok' | 'no more' | 'error'

type PersistListener<S> = (state: S) => void
type StorePersist<S, Ps> = {
	persist: {
		setOptions: (options: Partial<PersistOptions<S, Ps>>) => void
		clearStorage: () => void
		rehydrate: () => Promise<void> | void
		hasHydrated: () => boolean
		onHydrate: (fn: PersistListener<S>) => () => void
		onFinishHydration: (fn: PersistListener<S>) => () => void
		getOptions: () => Partial<PersistOptions<S, Ps>>
	}
}
type Write<T, U> = Omit<T, keyof U> & U
type WithImmer<S> = Write<S, StoreImmer<S>>
type StoreImmer<S> = S extends {
	getState: () => infer T
	setState: infer SetState
}
	? SetState extends (...a: infer A) => infer Sr
		? {
				setState(
					nextStateOrUpdater: T | Partial<T> | ((state: Draft<T>) => void),
					shouldReplace?: boolean | undefined,
					...a: SkipTwo<A>
				): Sr
			}
		: never
	: never

type SkipTwo<T> = T extends {
	length: 0
}
	? []
	: T extends {
				length: 1
		  }
		? []
		: T extends {
					length: 0 | 1
			  }
			? []
			: T extends [unknown, unknown, ...infer A]
				? A
				: T extends [unknown, unknown?, ...infer A]
					? A
					: T extends [unknown?, unknown?, ...infer A]
						? A
						: never
