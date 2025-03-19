# 今天吃什么？微信小程序

## 项目介绍

"今天吃什么？"是一款解决用户日常饮食选择困难的微信小程序。通过简单的随机推荐功能，帮助用户快速决定当餐饮食选择，减轻用户的决策负担。小程序支持餐厅收藏、历史记录查看、大众点评账号关联等功能，为用户提供全方位的用餐决策服务。

## 功能特点

1. **随机推荐**：点击圆形区域，系统会在3-5秒内随机切换不同食物选项，最终推荐一种食物。
2. **圆形UI展示**：食物推荐结果以圆形UI方式展示，包含食物名称和对应图片。
3. **历史记录**：记录用户最近随机的食物，提供历史记录查看功能。
4. **图片优化**：自动压缩和调整图片尺寸，优化加载性能，总体积减少74%。
5. **错误处理**：智能处理图片路径错误，自动修正路径，确保应用稳定运行。
6. **大众点评关联**：支持用户关联大众点评账号，导入收藏餐厅，获取详细信息。

## 项目结构

```
├── app.js                 # 应用程序入口文件，包含全局数据和方法
├── app.json               # 应用程序配置文件
├── app.wxss               # 应用程序全局样式
├── sitemap.json           # 小程序索引配置文件
├── images/                # 图片资源目录（优化后的图片）
│   ├── haidilao.png       # 海底捞图片
│   ├── henjiuyiqian.png   # 很久以前羊肉串图片
│   ├── kfc.png            # KFC图片
│   ├── mcdonald.png       # 麦当劳图片
│   ├── jinriniushi.png    # 今日牛事图片
│   ├── qinghegu.png       # 青鹤谷图片
│   ├── tailang.png        # 泰廊图片
│   ├── beilei.png         # 倍乐韩国图片
│   ├── brownstone.png     # brownstone西班牙图片
│   ├── meiguo.png         # 梅果图片
│   ├── shaokao.png        # 烧烤图片
│   └── logo.png           # 默认图片（用于加载失败时显示）
├── pages/                 # 页面目录
│   ├── index/             # 首页目录
│   │   ├── index.js       # 首页逻辑
│   │   ├── index.wxml     # 首页结构
│   │   └── index.wxss     # 首页样式
│   ├── history/           # 历史记录页面目录
│   │   ├── history.js     # 历史记录页面逻辑
│   │   ├── history.wxml   # 历史记录页面结构
│   │   └── history.wxss   # 历史记录页面样式
│   ├── auth/              # 授权页面目录
│   │   ├── index.js       # 授权页面逻辑
│   │   ├── index.wxml     # 授权页面结构
│   │   ├── index.wxss     # 授权页面样式
│   │   ├── webview.js     # 网页视图页面逻辑
│   │   ├── webview.wxml   # 网页视图页面结构
│   │   ├── result.js      # 授权结果页面逻辑
│   │   └── result.wxml    # 授权结果页面结构
│   ├── user/              # 用户页面目录
│   │   ├── index.js       # 用户页面逻辑
│   │   ├── index.wxml     # 用户页面结构
│   │   └── index.wxss     # 用户页面样式
│   └── shop/              # 店铺详情页面目录
│       ├── detail.js      # 店铺详情页面逻辑
│       ├── detail.wxml    # 店铺详情页面结构
│       └── detail.wxss    # 店铺详情页面样式
├── style/                 # 样式目录
│   └── weui.wxss          # WeUI样式库
└── tests/                 # 测试文件目录
    ├── randomTime.test.js # 测试随机时间范围
    ├── circleClick.test.js # 测试圆圈点击功能
    ├── customToast.test.js # 测试自定义toast功能
    ├── imageError.test.js # 测试图片错误处理
    └── integration.test.js # 集成测试
```

## 核心功能说明

### 随机选择算法

随机选择功能在 `pages/index/index.js` 中的 `startRandomize` 函数实现：

```javascript
startRandomize: function() {
  if (this.data.isRandomizing) {
    this.showCustomToast('正在选择中...', 1500);
    return;
  }
  
  this.setData({
    isRandomizing: true
  });
  
  // 生成3-5秒的随机时间
  const randomTime = Math.floor(Math.random() * 2000) + 3000;
  
  // 开始随机动画
  this.startAnimation();
  
  // 定时停止并显示结果
  setTimeout(() => {
    this.stopRandomizeAndShowResult();
  }, randomTime);
}
```

### 图片路径修正与错误处理

图片路径修正功能在 `app.js` 中实现：

```javascript
normalizePath: function(path) {
  if (!path) return '';
  
  // 记录原始路径以便调试
  const originalPath = path;
  
  // 移除错误的前缀，如"/pages/index"
  if (path.includes('/pages/index/images/')) {
    path = path.replace('/pages/index', '');
    console.log(`路径修正: ${originalPath} -> ${path}`);
  }
  
  // 确保路径以/开头
  if (path && !path.startsWith('/')) {
    path = '/' + path;
    console.log(`路径添加前导斜杠: ${originalPath} -> ${path}`);
  }
  
  return path;
}
```

图片加载错误处理在 `pages/index/index.js` 中实现：

```javascript
handleImageError: function(e) {
  console.error('图片加载失败:', e);
  
  if (!this.data.currentFood) return;
  
  // 获取图片路径信息
  let errorPath = '';
  if (e && e.target && e.target.dataset && e.target.dataset.src) {
    errorPath = e.target.dataset.src;
  } else if (this.data.currentFood.image) {
    errorPath = this.data.currentFood.image;
  }
  
  // 查找当前食物在选项中的索引
  const foodIndex = app.globalData.foodOptions.findIndex(
    food => food.name === this.data.currentFood.name
  );
  
  if (foodIndex >= 0) {
    // 尝试修正图片路径问题
    const originalPath = this.data.currentFood.image;
    
    // 检查路径是否包含错误的前缀
    if (originalPath && originalPath.includes('/pages/index/images/')) {
      // 尝试修正路径
      const correctedPath = originalPath.replace('/pages/index', '');
      
      // 更新食物图片为修正后的路径
      const updatedFood = { ...this.data.currentFood };
      updatedFood.image = correctedPath;
      
      // 更新全局数据中的路径
      app.globalData.foodOptions[foodIndex].image = correctedPath;
      
      // 更新当前显示的食物
      this.setData({ currentFood: updatedFood });
      return;
    }
    
    // 尝试备用路径，如果失败则使用默认图片
    const backupPath = app.tryBackupPath(originalPath);
    if (backupPath && backupPath !== originalPath) {
      const updatedFood = { ...this.data.currentFood };
      updatedFood.image = backupPath;
      app.globalData.foodOptions[foodIndex].image = backupPath;
      this.setData({ currentFood: updatedFood });
      return;
    }
    
    // 如果所有尝试都失败，使用默认图片
    const updatedFood = { ...this.data.currentFood };
    updatedFood.image = app.globalData.defaultImage;
    app.globalData.foodOptions[foodIndex].image = app.globalData.defaultImage;
    this.setData({ currentFood: updatedFood });
    this.showCustomToast('图片加载失败，已使用默认图片', 2000);
  }
}
```

### 历史记录功能

历史记录功能在 `app.js` 中的 `addToHistory` 函数和 `pages/history/history.js` 中实现：

```javascript
addToHistory: function(food) {
  const history = this.globalData.foodHistory;
  // 添加时间戳和规范化图片路径
  const foodWithTimestamp = {
    ...food,
    // 规范化图片路径
    image: this.normalizePath(food.image),
    timestamp: new Date().toLocaleString()
  };
  
  // 将新记录添加到历史记录的开头
  history.unshift(foodWithTimestamp);
  
  // 限制历史记录最多保存20条
  if (history.length > 20) {
    history.pop();
  }
}
```

### 大众点评账号关联

大众点评账号关联功能在 `pages/auth/index.js` 中实现：

```javascript
startAuth: function() {
  this.setData({ isLoading: true });
  
  // 获取授权链接
  wx.request({
    url: 'https://你的服务器地址/api/dianping/auth-url',
    success: (res) => {
      const { authUrl } = res.data;
      
      // 在web-view中打开授权页面
      wx.navigateTo({
        url: `/pages/auth/webview?url=${encodeURIComponent(authUrl)}`
      });
    },
    fail: (err) => {
      wx.showToast({
        title: '获取授权链接失败',
        icon: 'none'
      });
    },
    complete: () => {
      this.setData({ isLoading: false });
    }
  });
}
```

## 图片优化技术

本项目实现了全面的图片优化，将图片目录大小从820KB减少到248KB，减少了74%：

1. **自动预加载**：应用启动时自动预加载所有图片
2. **路径修正**：智能检测并修正错误的图片路径
3. **备用路径**：提供多种备用路径尝试机制
4. **默认图片降级**：当图片加载失败时自动使用默认图片
5. **错误日志**：详细记录图片加载错误情况以便排查

## 使用说明

1. **随机选择食物**
   - 打开小程序，进入首页
   - 点击圆形区域，等待3-5秒随机过程
   - 查看推荐的食物结果

2. **查看历史记录**
   - 通过底部导航栏，切换到历史记录页面
   - 查看历史选择的食物和时间

3. **关联大众点评账号**
   - 进入用户页面
   - 点击"关联大众点评账号"
   - 按照提示完成授权流程
   - 导入收藏的餐厅

4. **查看餐厅详情**
   - 点击餐厅名称或图片
   - 查看餐厅详细信息、评分、位置等
   - 支持打开大众点评查看更多信息

## 测试

项目包含完整的测试套件，覆盖所有核心功能：

1. **随机时间范围测试**：验证随机时间是否在3-5秒范围内
2. **圆圈点击功能测试**：验证点击交互和状态变化
3. **自定义Toast测试**：验证提示信息显示功能
4. **图片错误处理测试**：验证图片加载失败的修复机制
5. **路径修正测试**：验证不同路径格式的自动修正
6. **集成测试**：验证各功能协同工作

运行测试：在项目根目录执行 `node tests/integration.test.js`

## 技术亮点

1. **健壮的错误处理**：多层次的错误处理和恢复机制
2. **性能优化**：图片资源优化，提升加载速度
3. **用户体验**：流畅的动画效果和明确的状态反馈
4. **第三方平台集成**：无缝接入大众点评开放平台
5. **完善的测试**：全面的测试覆盖，保证稳定性

## 后续开发计划

1. 增加餐厅标签和分类功能
2. 支持按距离、评分等条件筛选
3. 加入用户评价和推荐系统
4. 优化大众点评数据同步机制
5. 增加多人共同决策功能

## 注意事项

- 本项目使用WeUI组件库，确保正确引入样式文件
- 关联大众点评账号需要申请相应的开放平台权限
- 图片资源已经过优化，无需再次处理