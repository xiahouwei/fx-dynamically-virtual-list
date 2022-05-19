import VirtualList from './src/VirtualList.vue'

export default {
    install(Vue, options){
        Vue.component('fx-virtual-list', VirtualList)
    }
}
