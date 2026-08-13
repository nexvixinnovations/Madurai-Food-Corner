package com.maduraifoodcorner.admin.data.api

import com.maduraifoodcorner.admin.data.model.*
import retrofit2.Response
import retrofit2.http.*

import okhttp3.MultipartBody
import okhttp3.RequestBody

interface AdminApiService {

    // Dashboard
    @GET("admin/dashboard")
    suspend fun getDashboardSummary(): Response<ApiResponse<DashboardOverview>>

    // Orders
    @GET("admin/orders")
    suspend fun getOrders(
        @Query("status") status: String? = null,
        @Query("search") search: String? = null
    ): Response<ApiResponse<List<Order>>>

    @POST("orders")
    suspend fun createPosOrder(@Body request: CreatePosOrderRequest): Response<ApiResponse<Order>>

    @GET("orders/{id}")
    suspend fun getOrderById(@Path("id") id: String): Response<ApiResponse<Order>>

    @PUT("orders/{id}/status")
    suspend fun updateOrderStatus(
        @Path("id") id: String,
        @Body request: OrderStatusUpdateRequest
    ): Response<ApiResponse<Order>>

    // Foods Catalog & Availability Management
    @GET("admin/foods")
    suspend fun getFoods(
        @Query("search") search: String? = null,
        @Query("category") category: String? = null
    ): Response<ApiResponse<List<FoodItem>>>

    @POST("admin/foods")
    suspend fun createFood(@Body request: FoodCreateRequest): Response<ApiResponse<FoodItem>>

    @Multipart
    @POST("admin/foods")
    suspend fun createFoodMultipart(
        @Part("name") name: RequestBody,
        @Part("category") category: RequestBody,
        @Part("food_type") foodType: RequestBody,
        @Part("price") price: RequestBody,
        @Part("offer_enabled") offerEnabled: RequestBody,
        @Part("offer_price") offerPrice: RequestBody?,
        @Part("available") available: RequestBody,
        @Part("online_available") onlineAvailable: RequestBody,
        @Part("available_days") availableDays: RequestBody,
        @Part image: MultipartBody.Part?
    ): Response<ApiResponse<FoodItem>>

    @Multipart
    @PUT("admin/foods/{id}")
    suspend fun updateFoodMultipart(
        @Path("id") id: String,
        @Part("name") name: RequestBody,
        @Part("category") category: RequestBody,
        @Part("food_type") foodType: RequestBody,
        @Part("price") price: RequestBody,
        @Part("offer_enabled") offerEnabled: RequestBody,
        @Part("offer_price") offerPrice: RequestBody?,
        @Part("available") available: RequestBody,
        @Part("online_available") onlineAvailable: RequestBody,
        @Part("available_days") availableDays: RequestBody,
        @Part image: MultipartBody.Part?
    ): Response<ApiResponse<FoodItem>>

    @PUT("admin/foods/bulk-availability")
    suspend fun bulkUpdateAvailability(@Body body: Map<String, Boolean>): Response<ApiResponse<Any>>

    @PATCH("admin/foods/{id}/status")
    suspend fun toggleFoodStatus(@Path("id") id: String, @Body body: Map<String, Boolean>): Response<ApiResponse<FoodItem>>

    @PUT("foods/{id}")
    suspend fun updateFood(
        @Path("id") id: String,
        @Body request: FoodCreateRequest
    ): Response<ApiResponse<FoodItem>>

    @DELETE("foods/{id}")
    suspend fun deleteFood(@Path("id") id: String): Response<ApiResponse<Unit>>

    // Menu Scheduling
    @GET("admin/menu")
    suspend fun getMenuSchedule(@Query("date") date: String? = null): Response<ApiResponse<List<FoodItem>>>

    @POST("menu")
    suspend fun scheduleMenu(@Body body: Map<String, Any>): Response<ApiResponse<Any>>

    // Combos
    @GET("admin/combos")
    suspend fun getCombos(): Response<ApiResponse<List<Combo>>>

    @POST("combos")
    suspend fun createCombo(@Body request: ComboCreateRequest): Response<ApiResponse<Combo>>

    @PATCH("combos/{id}/status")
    suspend fun toggleComboStatus(@Path("id") id: String, @Body body: Map<String, Boolean>): Response<ApiResponse<Combo>>

    @DELETE("combos/{id}")
    suspend fun deleteCombo(@Path("id") id: String): Response<ApiResponse<Unit>>

    // Offers
    @GET("admin/offers")
    suspend fun getOffers(): Response<ApiResponse<List<Offer>>>

    @POST("offers")
    suspend fun createOffer(@Body request: OfferCreateRequest): Response<ApiResponse<Offer>>

    @PATCH("offers/{id}/status")
    suspend fun toggleOfferStatus(@Path("id") id: String, @Body body: Map<String, Boolean>): Response<ApiResponse<Offer>>

    @DELETE("offers/{id}")
    suspend fun deleteOffer(@Path("id") id: String): Response<ApiResponse<Unit>>

    // Payments
    @GET("admin/payments")
    suspend fun getPayments(@Query("status") status: String? = null): Response<ApiResponse<List<Payment>>>

    // Reports
    @GET("admin/reports")
    suspend fun getReports(@Query("preset") preset: String = "today"): Response<ApiResponse<SalesReportData>>

    @GET("admin/reports")
    suspend fun getBusinessOverviewReport(@Query("type") type: String = "overview"): Response<ApiResponse<BusinessOverviewReport>>

    @Streaming
    @GET("admin/reports/export")
    suspend fun exportReport(
        @Query("type") type: String = "orders",
        @Query("format") format: String = "excel",
        @Query("preset") preset: String
    ): Response<okhttp3.ResponseBody>

    // Settings
    @GET("admin/settings")
    suspend fun getSettings(): Response<ApiResponse<RestaurantSettings>>

    @PUT("admin/settings")
    suspend fun updateSettings(@Body settings: RestaurantSettings): Response<ApiResponse<RestaurantSettings>>

    // Ordering Calendar
    @GET("admin/ordering-calendar")
    suspend fun getOrderingCalendar(): Response<ApiResponse<List<CalendarDateItem>>>

    @PUT("admin/ordering-calendar")
    suspend fun updateOrderingCalendar(@Body request: CalendarUpdateRequest): Response<ApiResponse<List<CalendarDateItem>>>

    // Notifications
    @GET("admin/notifications")
    suspend fun getNotifications(): Response<ApiResponse<List<AppNotification>>>
}
