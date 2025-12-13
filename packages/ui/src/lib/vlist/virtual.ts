type DataKey<T> = ((item: T, index: number) => any)
type EstimateSize<T> = ((item: T) => number)

interface IParam<T> {
    slotHeaderSize: number,
    slotFooterSize: number,
}

interface IRange {
    start: number,
    end: number,
    padFront: number,
    padBehind: number,
}

export class Virtual<T> {
    param: IParam<T>
    callUpdate: (range: IRange) => void
    currOffset = 0
    clientHeight = 0
    range: IRange
    /** array of sizes for each container */
    sizes = new Map<any, number>()
    /** array of offsets for each container */
    offsets: number[]
    getKeyFn: () => DataKey<T>
    getEstimateSize: () => number | EstimateSize<T>
    getOverflow: () => number
    getData: () => T[]

    get keyFn(): DataKey<T> {
        return this.getKeyFn()
    }

    get estimateSize(): EstimateSize<T> {
        const est = this.getEstimateSize()
        return est instanceof Function ? est : () => est
    }

    get overflow(): number {
        return this.getOverflow()
    }

    get data(): T[] {
        return this.getData()
    }

    constructor(param: IParam<T>, callUpdate: typeof this.callUpdate, getKeyFn: () => DataKey<T>, getEstimateSize: () => number | EstimateSize<T>, getOverflow: () => number, getData: () => T[]) {
        // param data
        this.param = param
        this.callUpdate = callUpdate
        this.getKeyFn = getKeyFn
        this.getEstimateSize = getEstimateSize
        this.getOverflow = getOverflow
        this.getData = getData

        // size data
        this.sizes = new Map()
        this.offsets = []
        this.data.forEach((d, i) => {
            let estimateSize = this.estimateSize(d)
            this.sizes.set(this.keyFn(d, i), estimateSize)
        })
        this.rebuildOffsets()

        this.range = Object.create({ start: -1, end: -1, padFront: 0, padBehind: 0 })
    }

    // return current render range
    getRange() {
        return { ...this.range }
    }

    // return start index offset
    getOffset(start: number) {
        return (start < 1 ? 0 : this.getIndexOffset(start)) + this.param.slotHeaderSize
    }

    updateParam<K extends keyof IParam<T>>(key: K, value: IParam<T>[K]) {
        if (this.param && (key in this.param)) {
            this.param[key] = value
        }
    }

    // save each size map by id
    saveSize(id: any, size: number) {
        if (this.sizes.get(id) === size) {
            return
        }
        this.sizes.set(id, size)
        this.rebuildOffsets(this.data.findIndex((d: T, i: number) => this.keyFn(d, i) === id))
    }
    // calculating range on scroll
    handleScroll(offset: number, clientHeight: number, forceUpdate = false) {
        this.currOffset = offset
        this.clientHeight = clientHeight
        let startIndex = Math.max(this.offsets.findIndex(o => o >= offset) - 1 - this.overflow, 0)
        let endIndex = this.offsets.findIndex(o => o >= offset + clientHeight)
        if (endIndex === -1) {
            endIndex = this.data.length - 1
        } else if (endIndex < startIndex) {
            endIndex = startIndex
        }
        endIndex = Math.min(endIndex + this.overflow, this.data.length - 1)
        this.updateRange(startIndex, endIndex, forceUpdate)
    }

    // ----------- public method end -----------

    // rebuilds the offset array
    rebuildOffsets(startIndex?: number) {
        if (startIndex === undefined) {
            this.offsets = [0]
            startIndex = 0
        }
        if (startIndex === -1) return
        let lastOffset = this.offsets[startIndex] || 0
        for (let i = startIndex + 1; i < this.data.length; i++) {
            let id = this.keyFn(this.data[i - 1], i - 1)
            lastOffset += this.sizes.get(id)!
            if (Number.isNaN(lastOffset)) {
            }
            this.offsets[i] = lastOffset
        }
    }

    // return a scroll offset from given index, can efficiency be improved more here?
    // although the call frequency is very high, its only a superposition of numbers
    getIndexOffset(givenIndex: number) {
        if (!givenIndex) {
            return 0
        }

        return this.offsets[givenIndex] || 0
    }

    // setting to a new range and rerender
    updateRange(start: number, end: number, forceUpdate = false) {
        if (!forceUpdate && start === this.range.start && end === this.range.end) return;
        this.range.start = start
        this.range.end = end
        this.range.padFront = this.getPadFront()
        this.range.padBehind = this.getPadBehind()
        this.callUpdate(this.range)
    }

    // return total front offset
    getPadFront() {
        return this.offsets[this.range.start] || 0
    }

    // return total behind offset
    getPadBehind() {
        if (this.range.end >= this.data.length - 1) {
            return 0
        }
        return this.offsets[this.offsets.length - 1] + this.sizes.get(this.keyFn(this.data[this.data.length - 1], this.data.length - 1))! - (this.offsets[this.range.end + 1])
    }
}

export function isBrowser() {
    return typeof document !== "undefined"
}