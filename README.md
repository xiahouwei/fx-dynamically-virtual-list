# fx-dynamically-virtual-list
动态行高虚拟渲染列表 
基于vue2.x
动态渲染list数据, 对于上万条数据渲染也不会卡顿
```javascript
<w-virtual-list :data="filteredDetails"></w-virtual-list> 
		<template slot-scope="scope">
      <div>{{scope.item.name}}</div>
    </template>
</w-virtual-list> 
```
