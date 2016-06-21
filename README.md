# multiplesug - 带搜索建议的多选列表

## 用法
```javascript
    $(function() {
        $('#input').multiplesug({
            url: '/server/data.json'
        });
    });
```

## API

| 属性 | 类型 | 说明 |
|----|---|---|
| url | string | （必需）请求数据接口的URL地址，需返回JSON数组格式 |
| keyParamName | string | 访问数据接口时传入关键字参数的名字，默认为"key" |
| limitParamName	| string | 访问数据接口时传入条目限制参数的名字，默认为"limit" |
| limit | number | 访问数据接口时传入条目限制参数的值，默认为5 |
| timeout | number | 输入行为停止后到访问数据接口之间的延迟，单位毫秒，默认为300 |
| jsonReader | function | 当数据接口返回的格式不是数组时，可指定函数从数据中解析出需要的数组部分 |
| initData | object | 初始已选中的条目数据集合。格式为 {key1: title1, key2: title2, ......} |
| maxSelected | number | 设置最多可选择的条目个数。默认为10000 |
| name | string | 设置组件元素的name，用于表单提交（例如 'ids[]' 或 'types[]' 等等。这个name的值将赋值到组件内部的select元素上） |
