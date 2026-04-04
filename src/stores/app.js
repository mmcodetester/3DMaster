// Utilities
import { defineStore } from 'pinia'

export const useAppStore = defineStore('app', {
  state: () => ({
    orderList: {
      data: [],
      total: 0
    },
    fullOrderList:[]
  }),
  actions: {
    AddToOrderList(order) {
      this.orderList.data.push(order)
      this.CalculateTotal()
    },
    SetFullOrderList (data){
      this.fullOrderList = []
      this.fullOrderList = data
    },
    RemoveFromOrderList(number_id) {
      this.orderList.data = this.orderList.data.filter(x => x.number_id !== number_id)
      this.CalculateTotal()
    },

    ClearOrderList() {
      this.orderList.data = []
      this.orderList.total = 0
    },

    CalculateTotal() {
      this.orderList.total = this.orderList.data.reduce(
        (sum, item) => sum + Number(item.amount || 0),
        0
      )
    }
  }
})
