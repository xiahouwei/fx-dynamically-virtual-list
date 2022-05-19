<template>
	<div ref="listContainer" class="wind-virtual-list" @scroll="onScroll">
		<div ref="phantomContent" class="wind-virtual-list__phantom-content" :style="{height: `${phantomHeight}px`}"></div>
		<div ref="actualContent" class="wind-virtual-list__actual-content" :style="{
			transform: getTransform
		}">
			<div
				v-for="(item) in visiableData"
				:key="item.$fxIndex"
				class="wind-virtual-list__item"
				:data-item="`item-${item.$fxIndex}`"
				:style="{
					left: 0,
					right: 0,
				}"
			>
				<slot :item="item" :$index="item.$fxIndex"></slot>
			</div>
		</div>
	</div>
</template>

<script type="text/babel">
/**
 * VirtualList by shang 2022/05/17
 * @desc VirtualList 虚拟list
 */
export default {
	name: 'w-virtual-list',
	props: {
		data: {
			type: Array,
			default: () => {
				return []
			}
		},
		limit: {
			type: Number,
			default: 30
		},
		bufferSize: {
			type: Number,
			default: 5
		},
		estimatedRowHeight: {
			type: Number,
			default: 10
		}
	},
	data () {
		return {
			startIndex: 0,
			endIndex: 0,
			scrollTop: 0,
			originStartIdx: 0,
			cachedPositions: [],
			phantomHeight: 0
		}
	},
	computed: {
		visiableData () {
			const list = this.data.slice(this.startIndex, this.endIndex)
			return list
		},
		getTransform () {
			const translateY = this.startIndex >= 1 ? this.cachedPositions[this.startIndex - 1].bottom : 0
			console.log('startIndex>>>', this.startIndex)
			console.log('cachedPositions>>>', this.cachedPositions)
			console.log('translateY>>>', translateY)
			return `translate3d(0,${translateY}px,0)`
		},
		total () {
			return this.data.length
		}
	},
	watch: {
		data: {
			immediate: true,
			handler (value) {
				this.data = this.initTableData(value)
				this.phantomHeight = value.length * this.estimatedRowHeight
				this.$nextTick(() => {
					this.updateVisibleData()
					this.initCachedPositions()
					this.$nextTick(() => {
						this.updateCachedPositions()
					})
				})
			}
		}
	},
	methods: {
		initTableData (tableData) {
			tableData.forEach((item, index) => {
				item.$fxIndex = index
			})
			return tableData
		},
		updateVisibleData () {
			this.endIndex = Math.min(0 + this.limit + this.bufferSize, this.data.length)
		},
		initCachedPositions () {
			const { estimatedRowHeight } = this
			this.cachedPositions = []
			for (let i = 0; i < this.total; ++i) {
				this.cachedPositions[i] = {
					index: i,
					height: estimatedRowHeight,
					top: i * estimatedRowHeight,
					bottom: (i + 1) * estimatedRowHeight,
					dValue: 0
				}
			}
		},
		resetAllVirtualParam () {
			this.originStartIdx = 0
			this.startIndex = 0
			this.endIndex = Math.min(
				this.originStartIdx + this.limit + this.bufferSize,
				this.total
			)
			this.$refs.listContainer.scrollTop = 0
			this.initCachedPositions()
			this.phantomHeight = this.estimatedRowHeight * this.total
			this.scrollTop = 0
		},
		updateCachedPositions () {
			if (!this.cachedPositions.length) {
				return false
			}
			const nodes = this.$refs.actualContent.childNodes
			const start = nodes[0]
			nodes.forEach((node) => {
				if (!node) {
					return
				}
				const rect = node.getBoundingClientRect()
				const { height } = rect
				const index = Number(node.dataset.item.split('-')[1])
				const oldHeight = this.cachedPositions[index].height
				const dValue = oldHeight - height
				if (dValue) {
					this.cachedPositions[index].bottom -= dValue
					this.cachedPositions[index].height = height
					this.cachedPositions[index].dValue = dValue
				}
			})
			let startIdx = 0
			if (start) {
				startIdx = Number(start.dataset.item.split('-')[1])
			}
			const cachedPositionsLen = this.cachedPositions.length
			let cumulativeDiffHeight = this.cachedPositions[startIdx].dValue
			this.cachedPositions[startIdx].dValue = 0
			for (let i = startIdx + 1; i < cachedPositionsLen; ++i) {
				const item = this.cachedPositions[i]
				this.cachedPositions[i].top = this.cachedPositions[i - 1].bottom
				this.cachedPositions[i].bottom = this.cachedPositions[i].bottom - cumulativeDiffHeight
				if (item.dValue !== 0) {
					cumulativeDiffHeight += item.dValue
					item.dValue = 0
				}
			}
			const height = this.cachedPositions[cachedPositionsLen - 1].bottom
			this.phantomHeight = height
			console.log(this.phantomHeight)
		},
		onScroll (e) {
			const { scrollTop } = e.target
			const { bufferSize, originStartIdx, total } = this
			const currentStartIndex = this.getStartIndex(scrollTop)
			if (currentStartIndex !== originStartIdx) {
				this.originStartIdx = currentStartIndex
				this.startIndex = Math.max(this.originStartIdx - bufferSize, 0)
				this.endIndex = Math.min(
					this.originStartIdx + this.limit + bufferSize,
					total
				)
				this.scrollTop = scrollTop
				this.$nextTick(() => {
					this.updateCachedPositions()
				})
			}
		},
		getStartIndex (scrollTop = 0) {
			let idx = this.binarySearch(this.cachedPositions, scrollTop, (currentValue, targetValue) => {
				const currentCompareValue = currentValue.bottom
				if (currentCompareValue === targetValue) {
					return 1
				}
				if (currentCompareValue < targetValue) {
					return 2
				}
				return 3
			})
			const targetItem = this.cachedPositions[idx]
			if (targetItem.bottom < scrollTop) {
				idx += 1
			}
			return idx
		},
		binarySearch (list, value, compareFunc) {
			let start = 0
			let end = list.length - 1
			let tempIndex = null

			while (start <= end) {
				tempIndex = Math.floor((start + end) / 2)
				const midValue = list[tempIndex]
				const compareRes = compareFunc(midValue, value)
				if (compareRes === 1) {
					return tempIndex
				}
				if (compareRes === 2) {
					start = tempIndex + 1
				} else if (compareRes === 3) {
					end = tempIndex - 1
				}
			}
			return tempIndex
		}
	}
}
</script>
<style lang="stylus" scoped>
@import '~assets/css/varsty.styl'
.wind-virtual-list {
	height: 100%
	overflow-y: auto
	position: relative
	&__phantom-content {
		position: relative
	}
	&__actual-content {
		position: absolute
		width: 100%;
        top: 0
	}
	&__item {
		// height: 50px
	}
}
</style>
