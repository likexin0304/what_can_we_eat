/**
 * 历史记录页面逻辑
 * 展示用户的食物选择历史记录
 */
const app = getApp();

Page({
  /**
   * 页面的初始数据
   * historyList: 历史记录列表
   */
  data: {
    historyList: []
  },

  /**
   * 生命周期函数--监听页面加载
   * 加载全局数据中的历史记录
   */
  onLoad: function() {
    this.setData({
      historyList: app.globalData.foodHistory
    });
    
    // 检查是否有历史记录，如果没有且是从tabBar直接访问，显示提示
    if (app.globalData.foodHistory.length === 0) {
      // 获取当前页面栈
      const pages = getCurrentPages();
      // 如果当前页面是第一个页面，说明是直接从tabBar访问的
      if (pages.length === 1) {
        wx.showToast({
          title: '暂无历史记录，请先在主页进行随机选择',
          icon: 'none',
          duration: 2000
        });
      }
    }
  },
  
  /**
   * 生命周期函数--监听页面显示
   * 确保每次显示页面时都获取最新的历史记录
   */
  onShow: function() {
    this.setData({
      historyList: app.globalData.foodHistory
    });
  },
  
  /**
   * 清空历史记录
   * 清空全局数据中的历史记录并更新页面
   */
  clearHistory: function() {
    wx.showModal({
      title: '提示',
      content: '确定要清空历史记录吗？',
      success: (res) => {
        if (res.confirm) {
          // 清空全局数据中的历史记录
          app.globalData.foodHistory = [];
          // 更新页面数据
          this.setData({
            historyList: []
          });
          // 显示提示
          wx.showToast({
            title: '已清空历史记录',
            icon: 'success',
            duration: 2000
          });
        }
      }
    });
  },
  
  // 返回首页功能已通过底部导航栏实现，不再需要goBack函数
});