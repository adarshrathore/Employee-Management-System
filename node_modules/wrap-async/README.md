# wrap-async
Wraps an async function so it can called synchronously

## Usage:

### Import:
```javascript
const wrap = require('wrap-async')
```

### Express controller:
```javascript
exports.getRequest = wrap(async function (req, res) {
  res.status(200)
})
```

### Immediate invocation:
```javascript
wrap(async function() {
  return await http()
})()
```
