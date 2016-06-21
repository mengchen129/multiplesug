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
|----|:---:|---:|
| url | string | （必需）请求数据接口的URL地址，需返回JSON数组格式 |
