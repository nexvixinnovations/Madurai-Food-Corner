package com.maduraifoodcorner.admin.ui.screens.foods

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.maduraifoodcorner.admin.data.model.*
import com.maduraifoodcorner.admin.data.repository.AdminRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.async
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

sealed class FoodsState {
    object Loading : FoodsState()
    data class Success(
        val foods: List<FoodItem>,
        val combos: List<Combo> = emptyList(),
        val offers: List<Offer> = emptyList()
    ) : FoodsState()
    data class Error(val message: String) : FoodsState()
}

@HiltViewModel
class FoodsViewModel @Inject constructor(
    private val repository: AdminRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow<FoodsState>(FoodsState.Loading)
    val uiState: StateFlow<FoodsState> = _uiState.asStateFlow()

    private val _toastMessage = MutableSharedFlow<String>()
    val toastMessage: SharedFlow<String> = _toastMessage.asSharedFlow()

    init {
        loadFoods()
    }

    fun loadFoods(search: String? = null, category: String? = null) {
        viewModelScope.launch {
            if (_uiState.value !is FoodsState.Success) {
                _uiState.value = FoodsState.Loading
            }
            try {
                val foodsDeferred = async { repository.getFoods(search, category) }
                val combosDeferred = async { repository.getCombos() }
                val offersDeferred = async { repository.getOffers() }

                val foodsRes = foodsDeferred.await()
                val combosRes = combosDeferred.await()
                val offersRes = offersDeferred.await()

                val foods = foodsRes.getOrDefault(emptyList())
                val combos = combosRes.getOrDefault(emptyList())
                val offers = offersRes.getOrDefault(emptyList())

                _uiState.value = FoodsState.Success(foods, combos, offers)
            } catch (e: Exception) {
                if (_uiState.value !is FoodsState.Success) {
                    _uiState.value = FoodsState.Error(e.message ?: "Failed to load menu catalog")
                } else {
                    _toastMessage.emit("Error refreshing menu: ${e.message}")
                }
            }
        }
    }

    private val _updatingIds = MutableStateFlow<Set<String>>(emptySet())
    val updatingIds: StateFlow<Set<String>> = _updatingIds.asStateFlow()

    fun toggleFoodStatus(foodId: String, currentAvailable: Boolean) {
        val currentState = _uiState.value
        if (currentState is FoodsState.Success) {
            val updatedFoods = currentState.foods.map {
                if (it.id == foodId) it.copy(available = !currentAvailable) else it
            }
            _uiState.value = currentState.copy(foods = updatedFoods)
            _updatingIds.value = _updatingIds.value + foodId

            viewModelScope.launch {
                repository.toggleFoodStatus(foodId, !currentAvailable)
                    .onSuccess {
                        _updatingIds.value = _updatingIds.value - foodId
                    }
                    .onFailure { error ->
                        _uiState.value = currentState
                        _updatingIds.value = _updatingIds.value - foodId
                        _toastMessage.emit(error.message ?: "Failed to toggle status")
                    }
            }
        }
    }

    fun toggleComboStatus(comboId: String, currentAvailable: Boolean) {
        viewModelScope.launch {
            repository.toggleComboStatus(comboId, !currentAvailable)
                .onSuccess { loadFoods() }
                .onFailure { error -> _toastMessage.emit(error.message ?: "Failed to toggle combo status") }
        }
    }

    fun toggleOfferStatus(offerId: String, currentAvailable: Boolean) {
        viewModelScope.launch {
            repository.toggleOfferStatus(offerId, !currentAvailable)
                .onSuccess { loadFoods() }
                .onFailure { error -> _toastMessage.emit(error.message ?: "Failed to toggle offer status") }
        }
    }

    fun bulkUpdateAvailability(available: Boolean) {
        viewModelScope.launch {
            repository.bulkUpdateAvailability(available)
                .onSuccess {
                    _toastMessage.emit("Updated catalog availability")
                    loadFoods()
                }
                .onFailure { error -> _toastMessage.emit(error.message ?: "Failed bulk availability update") }
        }
    }

    fun addFoodMultipart(
        name: String,
        category: String,
        foodType: String,
        price: Double,
        offerEnabled: Boolean,
        offerPrice: Double?,
        available: Boolean,
        onlineAvailable: Boolean = true,
        availableDays: String,
        imageFile: java.io.File?,
        mimeType: String = "image/jpeg",
        originalName: String? = null,
        onResult: ((Boolean, String?) -> Unit)? = null
    ) {
        viewModelScope.launch {
            repository.createFoodMultipart(
                name, category, foodType, price, offerEnabled, offerPrice, available, onlineAvailable, availableDays, imageFile, mimeType, originalName
            )
                .onSuccess {
                    _toastMessage.emit("Food item added successfully!")
                    loadFoods()
                    onResult?.invoke(true, null)
                }
                .onFailure { error ->
                    val errorMsg = error.message ?: "Failed to add food item"
                    _toastMessage.emit("Unable to add food item: $errorMsg")
                    onResult?.invoke(false, errorMsg)
                }
        }
    }

    fun updateFoodMultipart(
        id: String,
        name: String,
        category: String,
        foodType: String,
        price: Double,
        offerEnabled: Boolean,
        offerPrice: Double?,
        available: Boolean,
        onlineAvailable: Boolean = true,
        availableDays: String,
        imageFile: java.io.File?,
        mimeType: String = "image/jpeg",
        originalName: String? = null,
        onResult: ((Boolean, String?) -> Unit)? = null
    ) {
        viewModelScope.launch {
            repository.updateFoodMultipart(
                id, name, category, foodType, price, offerEnabled, offerPrice, available, onlineAvailable, availableDays, imageFile, mimeType, originalName
            )
                .onSuccess {
                    _toastMessage.emit("Food item updated successfully!")
                    loadFoods()
                    onResult?.invoke(true, null)
                }
                .onFailure { error ->
                    val errorMsg = error.message ?: "Failed to update food item"
                    _toastMessage.emit("Unable to update food item: $errorMsg")
                    onResult?.invoke(false, errorMsg)
                }
        }
    }

    fun createCombo(request: ComboCreateRequest) {
        viewModelScope.launch {
            repository.createCombo(request)
                .onSuccess {
                    _toastMessage.emit("Combo package created successfully!")
                    loadFoods()
                }
                .onFailure { error -> _toastMessage.emit("Unable to create combo: ${error.message}") }
        }
    }

    fun deleteCombo(id: String) {
        viewModelScope.launch {
            repository.deleteCombo(id)
                .onSuccess {
                    _toastMessage.emit("Combo deleted successfully")
                    loadFoods()
                }
                .onFailure { error -> _toastMessage.emit("Unable to delete combo: ${error.message}") }
        }
    }

    fun createOffer(request: OfferCreateRequest) {
        viewModelScope.launch {
            repository.createOffer(request)
                .onSuccess {
                    _toastMessage.emit("Promotional offer created successfully!")
                    loadFoods()
                }
                .onFailure { error -> _toastMessage.emit("Unable to create offer: ${error.message}") }
        }
    }

    fun deleteOffer(id: String) {
        viewModelScope.launch {
            repository.deleteOffer(id)
                .onSuccess {
                    _toastMessage.emit("Offer deleted successfully")
                    loadFoods()
                }
                .onFailure { error -> _toastMessage.emit("Unable to delete offer: ${error.message}") }
        }
    }

    fun deleteFood(id: String) {
        viewModelScope.launch {
            repository.deleteFood(id)
                .onSuccess {
                    _toastMessage.emit("Food item deleted successfully")
                    loadFoods()
                }
                .onFailure { error -> _toastMessage.emit("Unable to delete food item: ${error.message}") }
        }
    }
}
