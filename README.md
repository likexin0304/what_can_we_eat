# 今天吃什么？微信小程序

## 项目介绍

"今天吃什么？"是一款解决用户日常饮食选择困难的微信小程序。通过基于地理位置的餐厅推荐和随机选择功能，帮助用户快速决定当餐饮食选择，减轻用户的决策负担。小程序支持餐厅收藏、历史记录查看、根据餐厅类型显示不同图片等功能，为用户提供全方位的用餐决策服务。

## 功能特点

1. **基于地理位置的餐厅推荐**：获取用户当前位置，推荐指定半径范围内的餐厅。
2. **搜索半径调整**：用户可以调整搜索半径（1-10公里），查找更大范围的餐厅。
3. **餐厅分类图片**：根据餐厅类型（中餐、西餐、日料等）显示不同的代表图片。
4. **随机选择功能**：从附近餐厅中随机选择，解决选择困难。
5. **餐厅详情展示**：显示餐厅名称、类别、评分、距离和地址等详细信息。
6. **历史记录**：记录用户最近随机选择的餐厅，提供历史记录查看功能。
7. **图片优化与错误处理**：自动处理图片路径错误，确保应用稳定运行。
8. **加载动画**：加载数据时显示友好的加载动画，提升用户体验。
9. **本地数据模式**：支持使用模拟数据进行测试，确保无网络环境下也能使用。

## 开发环境

- 开发工具：微信开发者工具 1.06.2412050
- 基础库：3.0.2
- 小程序APPID：你的小程序APPID
- 高德地图API密钥：在高德开放平台创建的微信小程序KEY

## 项目结构

```
├── app.js                 # 应用程序入口文件，包含全局数据和方法
├── app.json               # 应用程序配置文件
├── app.wxss               # 应用程序全局样式
├── sitemap.json           # 小程序索引配置文件
├── images/                # 图片资源目录
│   ├── haidilao.png       # 火锅餐厅图片
│   ├── henjiuyiqian.png   # 通用餐厅图片
│   ├── kfc.png            # 肯德基图片
│   ├── mcdonald.png       # 麦当劳图片
│   ├── jinriniushi.png    # 日料图片
│   ├── renheguan.png      # 中餐图片
│   ├── shaokao.png        # 烧烤图片
│   ├── beilei.png         # 咖啡甜品图片
│   ├── brownstone.png     # 西餐图片
│   ├── meiguo.png         # 快餐图片
│   └── dabaokoufu.png     # 默认图片（用于加载失败时显示）
├── libs/                  # 第三方库目录
│   └── amap-wx.130.js     # 高德地图微信小程序SDK
├── pages/                 # 页面目录
│   ├── index/             # 首页目录
│   │   ├── index.js       # 首页逻辑
│   │   ├── index.wxml     # 首页结构
│   │   └── index.wxss     # 首页样式
│   ├── history/           # 历史记录页面目录
│   │   ├── history.js     # 历史记录页面逻辑
│   │   ├── history.wxml   # 历史记录页面结构
│   │   └── history.wxss   # 历史记录页面样式
│   └── user/              # 用户页面目录
│       ├── index.js       # 用户页面逻辑
│       ├── index.wxml     # 用户页面结构
│       └── index.wxss     # 用户页面样式
├── style/                 # 样式目录
│   └── weui.wxss          # WeUI样式库
└── tests/                 # 测试文件目录
    ├── unit/              # 单元测试目录
    │   └── location.test.js # 地理位置功能测试
    └── integration.test.js # 集成测试
```

## 核心功能说明

### 基于地理位置的餐厅推荐

使用微信小程序的`wx.getLocation`API获取用户当前位置，然后通过高德地图SDK的`getPoiAround`方法获取附近的餐厅信息：

```javascript
// 获取用户当前位置
getUserLocation: function() {
  wx.getLocation({
    type: 'gcj02', // 使用gcj02坐标系，与高德地图兼容
    success: (res) => {
      // 更新位置信息
      this.setData({
        userLocation: {
          latitude: res.latitude,
          longitude: res.longitude
        }
      });
      
      // 根据位置搜索附近餐厅
      this.fetchNearbyRestaurants();
    }
  });
}

// 获取附近餐厅数据
fetchNearbyRestaurants: function() {
  const { latitude, longitude } = this.data.userLocation;
  const radius = this.data.searchRadius * 1000; // 转换为米
  
  // 创建高德地图实例
  const amapInstance = new AMapWX.AMapWX({
    key: AMAP_KEY
  });
  
  // 使用高德SDK获取周边POI
  amapInstance.getPoiAround({
    querykeywords: '餐厅|美食',
    querytypes: '050000', // 餐饮类POI
    location: `${longitude},${latitude}`,
    radius: radius, // 搜索半径参数
    success: (res) => {
      // 处理返回的餐厅数据
      if (res && res.poisData && res.poisData.length > 0) {
        const restaurants = res.poisData.map(item => {
          // 处理餐厅数据...
        });
        
        this.setData({
          nearbyRestaurants: restaurants
        });
      }
    }
  });
}
```

### 随机选择功能

从附近餐厅中随机选择一个餐厅，并展示相关信息：

```javascript
startRandomizeWithLocation: function() {
  // 检查是否有餐厅数据
  const restaurants = this.data.nearbyRestaurants;
  
  // 设置为随机选择状态
  this.setData({ isRandomizing: true });
  
  // 随机时间，3-5秒
  const randomTime = Math.floor(Math.random() * 2000) + 3000;
  const intervalTime = 100; // 切换间隔时间
  let elapsedTime = 0;
  let intervalId;
  
  // 创建淡入淡出动画
  const fadeAnimation = () => {
    // 动画效果...
    setTimeout(() => {
      // 随机选择一个餐厅
      const randomIndex = Math.floor(Math.random() * restaurants.length);
      this.setData({ currentFood: restaurants[randomIndex] });
    }, 150);
  };
  
  // 开始随机切换餐厅
  fadeAnimation();
  intervalId = setInterval(() => {
    // 随机切换餐厅
    fadeAnimation();
    
    // 达到随机时间后停止
    if (elapsedTime >= randomTime) {
      clearInterval(intervalId);
      
      // 记录最终结果
      // ...
    }
  }, intervalTime);
}
```

### 餐厅类型图片匹配

根据餐厅类型返回对应的图片路径：

```javascript
function getRestaurantImageByCategory(category) {
  // 将类别转换为小写，方便匹配
  const lowerCategory = (category || '').toLowerCase();
  
  // 中餐类
  if (lowerCategory.includes('中餐') || 
      lowerCategory.includes('川菜') || 
      lowerCategory.includes('火锅')) {
    if (lowerCategory.includes('火锅')) {
      return '/images/haidilao.png';
    } else {
      return '/images/renheguan.png';
    }
  }
  
  // 西餐类
  else if (lowerCategory.includes('西餐') || 
          lowerCategory.includes('牛排')) {
    return '/images/brownstone.png';
  }
  
  // 日料类
  else if (lowerCategory.includes('日本') || 
          lowerCategory.includes('寿司')) {
    return '/images/jinriniushi.png';
  }
  
  // 默认图片
  else {
    return '/images/dabaokoufu.png';
  }
}
```

### 图片加载错误处理

处理图片加载失败的情况，确保应用稳定运行：

```javascript
handleImageError: function(e) {
  // 获取错误的图片路径
  const errorImgSrc = e.target.dataset.src;
  
  // 替换为默认图片
  if (this.data.currentFood) {
    const updatedFood = {...this.data.currentFood};
    updatedFood.image = '/images/dabaokoufu.png';
    
    this.setData({
      currentFood: updatedFood
    });
  }
}
```

## 使用说明

### 小程序配置要求

1. **域名配置**：
   在微信公众平台 -> 开发 -> 开发设置 -> 服务器域名中添加：
   - `https://restapi.amap.com`（高德地图REST API）
   - `https://webapi.amap.com`（高德地图Web API，可选）

2. **API接口配置**：
   在微信公众平台 -> 开发 -> 接口设置中，开启：
   - 地理位置接口

3. **高德地图API密钥**：
   - 前往高德开放平台（https://lbs.amap.com/）创建一个微信小程序类型的应用
   - 获取Key并配置安全域名为你的小程序AppID

### 本地开发调试

1. 在微信开发者工具中，开启"不校验合法域名、web-view（业务域名）、TLS 版本以及 HTTPS 证书"选项
2. 替换`pages/index/index.js`中的`AMAP_KEY`变量为你的高德地图API密钥
3. 运行项目，测试获取位置、搜索餐厅功能

### 发布说明

1. 确保已在微信公众平台配置了合法域名
2. 上传代码并提交审核
3. 审核通过后发布小程序

## 常见问题

1. **图片无法加载**：
   - 确保图片文件存在于images目录中
   - 检查图片路径是否正确
   - 对于缺失的图片，会自动使用默认图片替代

2. **无法获取位置**：
   - 确保小程序已开启地理位置接口权限
   - 确保用户已授予位置权限
   - 检查app.json中是否配置了位置权限说明

3. **无法连接高德地图服务**：
   - 确保已在微信公众平台配置了合法域名
   - 检查高德地图API密钥是否正确
   - 在开发工具中可临时开启"不校验合法域名"选项进行调试

## 未来计划

1. 添加餐厅收藏功能
2. 接入餐厅评论和用户评分系统
3. 优化搜索体验，支持按菜系、价格区间筛选
4. 实现基于用户口味偏好的智能推荐算法

## 开源许可

本项目使用MIT许可证。详情请查看LICENSE文件。