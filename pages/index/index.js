/**
 * 首页逻辑
 * 实现随机食物推荐功能
 */
const app = getApp();

Page({
  /**
   * 页面的初始数据
   * currentFood: 当前显示的食物
   * isRandomizing: 是否正在随机选择中
   * animationData: 动画数据
   * showCustomToast: 是否显示自定义Toast
   * customToastText: 自定义Toast文本内容
   */
  data: {
    currentFood: null,
    isRandomizing: false,
    animationData: {},
    showCustomToast: false,
    customToastText: ''
  },

  /**
   * 生命周期函数--监听页面加载
   * 在页面加载时执行，只触发一次
   * 初始化页面所需的动画实例和导航状态标志
   */
  onLoad: function() {
    // 创建动画实例，设置动画持续时间和缓动函数
    this.animation = wx.createAnimation({
      duration: 300, // 动画持续时间，单位为毫秒
      timingFunction: 'ease', // 动画缓动函数，使动画更自然
    });
    
    // 初始化导航标志，防止重复导航操作
    this.navigating = false;
  },

  /**
   * 处理图片加载错误
   * 当图片加载失败时使用默认图片替代
   */
  handleImageError: function(e) {
    console.error('图片加载失败:', e);
    
    if (!this.data.currentFood) return;
    
    // 查找当前食物在选项中的索引
    const foodIndex = app.globalData.foodOptions.findIndex(
      food => food.name === this.data.currentFood.name
    );
    
    if (foodIndex >= 0) {
      // 更新食物图片为默认图片
      const updatedFood = { ...this.data.currentFood };
      updatedFood.image = app.globalData.defaultImage;
      
      // 同时更新全局数据，防止下次随机到同一食物时再次出错
      app.globalData.foodOptions[foodIndex].image = app.globalData.defaultImage;
      
      // 更新当前显示的食物
      this.setData({ currentFood: updatedFood });
      
      // 显示提示
      this.showCustomToast('图片加载失败，已使用默认图片', 2000);
    }
  },

  /**
   * 显示自定义Toast
   * @param {string} text - 要显示的文本内容
   * @param {number} duration - 显示持续时间，单位为毫秒
   */
  showCustomToast: function(text, duration = 2000) {
    this.setData({
      customToastText: text,
      showCustomToast: true
    });
    
    // 设置定时器，在指定时间后隐藏Toast
    setTimeout(() => {
      this.setData({
        showCustomToast: false
      });
    }, duration);
  },

  /**
   * 开始随机选择食物
   * 核心功能：随机选择食物并展示
   * 实现方式：
   * 1. 设置随机时间（3-5秒）
   * 2. 在随机时间内快速切换不同食物选项
   * 3. 结束后停留在随机选中的食物上
   * 4. 将选中的食物添加到历史记录
   * 注意：现在这个函数绑定在food-circle的点击事件上
   */
  startRandomize: function() {
    // 如果已经在随机选择过程中，直接返回
    if (this.data.isRandomizing) {
      // 使用自定义Toast替代wx.showToast
      this.showCustomToast('正在选择中...', 1000);
      return;
    }
    
    const foodOptions = app.globalData.foodOptions;
    if (foodOptions.length === 0) {
      // 使用自定义Toast替代wx.showToast
      this.showCustomToast('没有可选择的食物选项', 2000);
      return;
    }
    
    // 设置为随机选择状态
    this.setData({ isRandomizing: true });
    
    // 随机时间，3-5秒
    const randomTime = Math.floor(Math.random() * 2000) + 3000;
    const intervalTime = 100; // 切换间隔时间
    let elapsedTime = 0;
    let intervalId;
    
    // 创建淡入淡出动画
    const fadeAnimation = () => {
      this.animation.opacity(0).step();
      this.setData({ animationData: this.animation.export() });
      
      setTimeout(() => {
        // 随机选择一个食物
        const randomIndex = Math.floor(Math.random() * foodOptions.length);
        this.setData({ currentFood: foodOptions[randomIndex] });
        
        // 淡入动画
        this.animation.opacity(1).step();
        this.setData({ animationData: this.animation.export() });
      }, 150);
    };
    
    // 开始随机切换食物
    fadeAnimation();
    intervalId = setInterval(() => {
      elapsedTime += intervalTime;
      
      // 随机切换食物
      fadeAnimation();
      
      // 达到随机时间后停止
      if (elapsedTime >= randomTime) {
        clearInterval(intervalId);
        
        // 停止随机选择，但等待最后一次动画完成后再记录最终结果
        setTimeout(() => {
          // 停止随机选择，确保当前食物不再变化
          const finalSelectedFood = {...this.data.currentFood};
          
          // 添加到历史记录
          app.addToHistory(finalSelectedFood);
          
          // 设置为非随机选择状态
          this.setData({ isRandomizing: false });
          
          // 使用自定义Toast替代wx.showToast
          this.showCustomToast('今天就吃这个吧！', 2000);
        }, 200); // 等待时间略大于fadeAnimation中的setTimeout时间(150ms)
      }
    }, intervalTime);
  }
  
  // goToHistory函数已移除，现在通过底部导航栏访问历史记录页面
});