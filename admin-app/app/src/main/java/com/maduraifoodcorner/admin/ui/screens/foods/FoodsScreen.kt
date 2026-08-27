package com.maduraifoodcorner.admin.ui.screens.foods

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import android.os.Build
import android.widget.Toast
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.ui.text.input.KeyboardType
import coil.compose.AsyncImage
import com.maduraifoodcorner.admin.data.model.FoodItem
import com.maduraifoodcorner.admin.data.model.FoodCreateRequest
import com.maduraifoodcorner.admin.data.model.Combo
import com.maduraifoodcorner.admin.data.model.ComboCreateRequest
import com.maduraifoodcorner.admin.data.model.Offer
import com.maduraifoodcorner.admin.data.model.OfferCreateRequest
import com.maduraifoodcorner.admin.data.model.*
import com.maduraifoodcorner.admin.ui.components.LoadingState
import java.io.File
import java.io.FileOutputStream

data class UploadFileData(
    val file: File,
    val mimeType: String,
    val originalName: String
)

fun uriToUploadFile(context: Context, uri: Uri): UploadFileData? {
    return try {
        val contentResolver = context.contentResolver
        val rawMimeType = contentResolver.getType(uri) ?: "image/jpeg"
        val cleanMimeType = when {
            rawMimeType.contains("png", ignoreCase = true) -> "image/png"
            rawMimeType.contains("webp", ignoreCase = true) -> "image/webp"
            else -> "image/jpeg"
        }
        val ext = when (cleanMimeType) {
            "image/png" -> ".png"
            "image/webp" -> ".webp"
            else -> ".jpg"
        }
        val timestamp = System.currentTimeMillis()
        val originalName = "food_$timestamp$ext"

        val inputStream = contentResolver.openInputStream(uri) ?: return null
        val bitmap = BitmapFactory.decodeStream(inputStream)
        inputStream.close()

        if (bitmap == null) return null

        // Scale down to max 1280px to prevent huge payloads and timeouts
        val maxDimension = 1280
        val width = bitmap.width
        val height = bitmap.height
        val scaledBitmap = if (width > maxDimension || height > maxDimension) {
            val ratio = width.toFloat() / height.toFloat()
            val (newWidth, newHeight) = if (ratio > 1f) {
                maxDimension to (maxDimension / ratio).toInt()
            } else {
                (maxDimension * ratio).toInt() to maxDimension
            }
            Bitmap.createScaledBitmap(bitmap, newWidth, newHeight, true)
        } else {
            bitmap
        }

        val tempFile = File.createTempFile("food_$timestamp", ext, context.cacheDir)
        val outputStream = FileOutputStream(tempFile)
        val compressFormat = when (cleanMimeType) {
            "image/png" -> Bitmap.CompressFormat.PNG
            "image/webp" -> if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) Bitmap.CompressFormat.WEBP_LOSSY else Bitmap.CompressFormat.WEBP
            else -> Bitmap.CompressFormat.JPEG
        }
        scaledBitmap.compress(compressFormat, 85, outputStream)
        outputStream.flush()
        outputStream.close()

        UploadFileData(
            file = tempFile,
            mimeType = cleanMimeType,
            originalName = originalName
        )
    } catch (e: Exception) {
        null
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FoodsScreen(
    onOpenDrawer: () -> Unit,
    viewModel: FoodsViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    val updatingIds by viewModel.updatingIds.collectAsState()
    var showTypePickerModal by remember { mutableStateOf(false) }
    var showAddFoodDialog by remember { mutableStateOf(false) }
    var showAddComboDialog by remember { mutableStateOf(false) }
    var showAddOfferDialog by remember { mutableStateOf(false) }
    var editingFoodItem by remember { mutableStateOf<FoodItem?>(null) }
    var selectedCategory by remember { mutableStateOf("All") }
    var showBulkConfirmDialog by remember { mutableStateOf<Boolean?>(null) }
    val context = LocalContext.current

    val categories = listOf("All", "Non-Veg", "Veg", "Egg Items", "Snacks", "Combos", "Offers")

    LaunchedEffect(Unit) {
        viewModel.loadFoods()
    }

    LaunchedEffect(Unit) {
        viewModel.toastMessage.collect { msg ->
            Toast.makeText(context, msg, Toast.LENGTH_LONG).show()
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Food Management", fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onOpenDrawer) {
                        Icon(Icons.Default.Menu, contentDescription = "Drawer")
                    }
                },
                actions = {
                    // Bulk Enable All
                    IconButton(onClick = { showBulkConfirmDialog = true }) {
                        Icon(Icons.Default.CheckCircle, contentDescription = "Enable All", tint = Color(0xFF2E7D32))
                    }
                    // Bulk Disable All
                    IconButton(onClick = { showBulkConfirmDialog = false }) {
                        Icon(Icons.Default.Cancel, contentDescription = "Disable All", tint = Color(0xFFC62828))
                    }
                    IconButton(onClick = { viewModel.loadFoods() }) {
                        Icon(Icons.Default.Refresh, contentDescription = "Refresh")
                    }
                }
            )
        },
        floatingActionButton = {
            FloatingActionButton(
                onClick = { showTypePickerModal = true },
                containerColor = MaterialTheme.colorScheme.primary
            ) {
                Icon(Icons.Default.Add, contentDescription = "Add New Menu Item")
            }
        }
    ) { padding ->
        Column(modifier = Modifier.padding(padding).fillMaxSize()) {
            // Category Filter Chips
            LazyRow(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 8.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                items(categories) { cat ->
                    FilterChip(
                        selected = selectedCategory == cat,
                        onClick = { selectedCategory = cat },
                        label = { Text(cat, fontWeight = FontWeight.Bold) }
                    )
                }
            }

            Box(modifier = Modifier.weight(1f)) {
                when (val state = uiState) {
                    is FoodsState.Loading -> LoadingState("Loading menu catalog...")
                    is FoodsState.Error -> {
                        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                Text(text = state.message, color = MaterialTheme.colorScheme.error)
                                Spacer(modifier = Modifier.height(8.dp))
                                Button(onClick = { viewModel.loadFoods() }) {
                                    Text("Retry")
                                }
                            }
                        }
                    }
                    is FoodsState.Success -> {
                        val filteredFoods = state.foods.filter { food ->
                            when (selectedCategory) {
                                "All", "Combos", "Offers" -> false
                                else -> food.category.equals(selectedCategory, ignoreCase = true) ||
                                        food.food_type.equals(selectedCategory, ignoreCase = true)
                            }
                        }

                        LazyColumn(
                            modifier = Modifier.fillMaxSize(),
                            contentPadding = PaddingValues(16.dp),
                            verticalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            // 1. Render Combos when "Combos" or "All" selected
                            if (selectedCategory == "Combos" || selectedCategory == "All") {
                                items(state.combos, key = { it.id }) { combo ->
                                    ComboCardRow(
                                        combo = combo,
                                        onToggleStatus = { viewModel.toggleComboStatus(combo.id, combo.available) },
                                        onDelete = { viewModel.deleteCombo(combo.id) }
                                    )
                                }
                            }

                            // 2. Render Offers when "Offers" or "All" selected
                            if (selectedCategory == "Offers" || selectedCategory == "All") {
                                items(state.offers, key = { it.id }) { offer ->
                                    OfferCardRow(
                                        offer = offer,
                                        onToggleStatus = { viewModel.toggleOfferStatus(offer.id, offer.available) },
                                        onDelete = { viewModel.deleteOffer(offer.id) }
                                    )
                                }
                            }

                            // 3. Render Food Items when specific category or "All" selected
                            if (selectedCategory != "Combos" && selectedCategory != "Offers") {
                                val foodListToRender = if (selectedCategory == "All") state.foods else filteredFoods
                                items(foodListToRender, key = { it.id }) { food ->
                                    val isUpdating = updatingIds.contains(food.id)
                                    FoodCardRow(
                                        food = food,
                                        isUpdating = isUpdating,
                                        onEdit = { editingFoodItem = food },
                                        onToggleStatus = { viewModel.toggleFoodStatus(food.id, food.available) },
                                        onDelete = { viewModel.deleteFood(food.id) }
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }

        // 3-Option Picker Dialog: New Item | Combo | Offer
        if (showTypePickerModal) {
            AlertDialog(
                onDismissRequest = { showTypePickerModal = false },
                title = { Text("Select Type to Add", fontWeight = FontWeight.Bold) },
                text = {
                    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        Card(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable {
                                    showTypePickerModal = false
                                    showAddFoodDialog = true
                                },
                            shape = RoundedCornerShape(12.dp)
                        ) {
                            Row(modifier = Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
                                Icon(Icons.Default.RestaurantMenu, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
                                Spacer(modifier = Modifier.width(12.dp))
                                Column {
                                    Text("New Food Item", fontWeight = FontWeight.Bold)
                                    Text("Add a single dish (e.g., Biriyani, Rice, Noodles)", fontSize = 11.sp, color = Color.Gray)
                                }
                            }
                        }

                        Card(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable {
                                    showTypePickerModal = false
                                    showAddComboDialog = true
                                },
                            shape = RoundedCornerShape(12.dp)
                        ) {
                            Row(modifier = Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
                                Icon(Icons.Default.Fastfood, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
                                Spacer(modifier = Modifier.width(12.dp))
                                Column {
                                    Text("Combo Package", fontWeight = FontWeight.Bold)
                                    Text("Combine catalog items (Dine-In vs Parcel)", fontSize = 11.sp, color = Color.Gray)
                                }
                            }
                        }

                        Card(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable {
                                    showTypePickerModal = false
                                    showAddOfferDialog = true
                                },
                            shape = RoundedCornerShape(12.dp)
                        ) {
                            Row(modifier = Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
                                Icon(Icons.Default.LocalOffer, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
                                Spacer(modifier = Modifier.width(12.dp))
                                Column {
                                    Text("Promotional Offer", fontWeight = FontWeight.Bold)
                                    Text("Create tag offer with specific items & offer price", fontSize = 11.sp, color = Color.Gray)
                                }
                            }
                        }
                    }
                },
                confirmButton = {},
                dismissButton = {
                    TextButton(onClick = { showTypePickerModal = false }) {
                        Text("Cancel")
                    }
                }
            )
        }

        // Bulk Availability Confirmation Dialog
        showBulkConfirmDialog?.let { targetEnable ->
            AlertDialog(
                onDismissRequest = { showBulkConfirmDialog = null },
                title = { Text(if (targetEnable) "ENABLE ALL ITEMS?" else "DISABLE ALL ITEMS?", fontWeight = FontWeight.Bold) },
                text = {
                    Text(
                        if (targetEnable)
                            "Are you sure you want to turn ON availability for all food items, combos, and offers?"
                        else
                            "Are you sure you want to turn OFF availability for all food items? Customers will not be able to order items while disabled."
                    )
                },
                confirmButton = {
                    Button(
                        onClick = {
                            viewModel.bulkUpdateAvailability(targetEnable)
                            showBulkConfirmDialog = null
                            Toast.makeText(context, if (targetEnable) "All items enabled" else "All items disabled", Toast.LENGTH_SHORT).show()
                        },
                        colors = ButtonDefaults.buttonColors(
                            containerColor = if (targetEnable) Color(0xFF2E7D32) else Color(0xFFC62828)
                        )
                    ) {
                        Text(if (targetEnable) "Enable All" else "Disable All", color = Color.White)
                    }
                },
                dismissButton = {
                    TextButton(onClick = { showBulkConfirmDialog = null }) {
                        Text("Cancel")
                    }
                }
            )
        }

        if (showAddFoodDialog) {
            AddFoodDialog(
                onDismiss = { showAddFoodDialog = false },
                onAddMultipart = { name, category, foodType, price, offerEnabled, offerPrice, available, onlineAvailable, availableDays, imageFile, mimeType, originalName, onComplete ->
                    viewModel.addFoodMultipart(
                        name, category, foodType, price, offerEnabled, offerPrice, available, onlineAvailable, availableDays, imageFile, mimeType, originalName, onComplete
                    )
                }
            )
        }

        if (showAddComboDialog && uiState is FoodsState.Success) {
            val catalogFoods = (uiState as FoodsState.Success).foods
            AddComboDialog(
                catalogFoods = catalogFoods,
                onDismiss = { showAddComboDialog = false },
                onCreateCombo = { comboReq ->
                    viewModel.createCombo(comboReq)
                    showAddComboDialog = false
                }
            )
        }

        if (showAddOfferDialog && uiState is FoodsState.Success) {
            val catalogFoods = (uiState as FoodsState.Success).foods
            AddOfferDialog(
                catalogFoods = catalogFoods,
                onDismiss = { showAddOfferDialog = false },
                onCreateOffer = { offerReq ->
                    viewModel.createOffer(offerReq)
                    showAddOfferDialog = false
                }
            )
        }

        editingFoodItem?.let { food ->
            EditFoodDialog(
                food = food,
                onDismiss = { editingFoodItem = null },
                onUpdateMultipart = { id, name, category, foodType, price, offerEnabled, offerPrice, available, onlineAvailable, availableDays, imageFile, mimeType, originalName, onComplete ->
                    viewModel.updateFoodMultipart(
                        id, name, category, foodType, price, offerEnabled, offerPrice, available, onlineAvailable, availableDays, imageFile, mimeType, originalName, onComplete
                    )
                }
            )
        }
    }
}

@Composable
fun FoodCardRow(
    food: FoodItem,
    isUpdating: Boolean = false,
    onEdit: () -> Unit,
    onToggleStatus: () -> Unit,
    onDelete: () -> Unit
) {
    val isVeg = food.category.equals("Veg", ignoreCase = true) || food.food_type.equals("Veg", ignoreCase = true)

    Card(
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(72.dp)
                    .clip(RoundedCornerShape(12.dp))
                    .background(Color.LightGray.copy(alpha = 0.3f)),
                contentAlignment = Alignment.Center
            ) {
                if (!food.image_url.isNullOrEmpty()) {
                    AsyncImage(
                        model = food.image_url,
                        contentDescription = food.name,
                        contentScale = ContentScale.Crop,
                        modifier = Modifier.fillMaxSize()
                    )
                } else {
                    Icon(
                        imageVector = Icons.Default.Restaurant,
                        contentDescription = "Default Food Image",
                        tint = Color.Gray,
                        modifier = Modifier.size(32.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.width(12.dp))

            Column(modifier = Modifier.weight(1f)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Surface(
                        shape = RoundedCornerShape(4.dp),
                        color = if (isVeg) Color(0xFF2E7D32) else Color(0xFFC62828),
                        modifier = Modifier.size(12.dp)
                    ) {}
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(text = food.name, fontWeight = FontWeight.Bold, fontSize = 15.sp)
                }

                Spacer(modifier = Modifier.height(2.dp))
                Text(text = "Cat: ${food.category} • ${food.available_days ?: "Every Day"}", fontSize = 11.sp, color = Color.Gray)

                Spacer(modifier = Modifier.height(4.dp))
                Row(verticalAlignment = Alignment.CenterVertically) {
                    if (food.offer_enabled && food.offer_price != null) {
                        Text(
                            text = "₹${food.offer_price.toInt()}",
                            fontSize = 15.sp,
                            fontWeight = FontWeight.ExtraBold,
                            color = MaterialTheme.colorScheme.primary
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = "₹${food.price.toInt()}",
                            fontSize = 12.sp,
                            color = Color.Gray,
                            textDecoration = TextDecoration.LineThrough
                        )
                    } else {
                        Text(
                            text = "₹${food.price.toInt()}",
                            fontSize = 15.sp,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                    }
                }
            }

            Column(horizontalAlignment = Alignment.End) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    if (isUpdating) {
                        CircularProgressIndicator(modifier = Modifier.size(14.dp), strokeWidth = 2.dp)
                        Spacer(modifier = Modifier.width(4.dp))
                    }
                    Text(
                        text = if (food.available) "ON" else "OFF",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = if (food.available) Color(0xFF2E7D32) else Color(0xFFC62828)
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Switch(
                        checked = food.available,
                        onCheckedChange = { onToggleStatus() },
                        enabled = !isUpdating
                    )
                }
                Row {
                    IconButton(onClick = onEdit, modifier = Modifier.size(28.dp)) {
                        Icon(Icons.Default.Edit, contentDescription = "Edit Food", tint = MaterialTheme.colorScheme.primary, modifier = Modifier.size(18.dp))
                    }
                    IconButton(onClick = onDelete, modifier = Modifier.size(28.dp)) {
                        Icon(Icons.Default.Delete, contentDescription = "Delete Food", tint = Color.Gray, modifier = Modifier.size(18.dp))
                    }
                }
            }
        }
    }
}

@Composable
fun ComboCardRow(
    combo: Combo,
    onToggleStatus: () -> Unit,
    onDelete: () -> Unit
) {
    val itemsSummary = combo.combo_items.joinToString(" + ") { it.food_items?.name ?: "Item" }

    Card(
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(72.dp)
                    .clip(RoundedCornerShape(12.dp))
                    .background(Color(0xFFFFF3E0)),
                contentAlignment = Alignment.Center
            ) {
                if (!combo.image_url.isNullOrEmpty()) {
                    AsyncImage(
                        model = combo.image_url,
                        contentDescription = combo.name,
                        contentScale = ContentScale.Crop,
                        modifier = Modifier.fillMaxSize()
                    )
                } else {
                    Icon(
                        imageVector = Icons.Default.Fastfood,
                        contentDescription = "Combo Package",
                        tint = Color(0xFFE65100),
                        modifier = Modifier.size(32.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.width(12.dp))

            Column(modifier = Modifier.weight(1f)) {
                Surface(
                    shape = RoundedCornerShape(4.dp),
                    color = Color(0xFFFF9800),
                    modifier = Modifier.padding(bottom = 2.dp)
                ) {
                    Text("COMBO PACKAGE", fontSize = 9.sp, fontWeight = FontWeight.Bold, color = Color.White, modifier = Modifier.padding(horizontal = 4.dp, vertical = 1.dp))
                }
                Text(text = combo.name, fontWeight = FontWeight.Bold, fontSize = 15.sp)

                if (itemsSummary.isNotBlank()) {
                    Text(text = itemsSummary, fontSize = 11.sp, color = Color.Gray, maxLines = 1)
                }

                Spacer(modifier = Modifier.height(4.dp))
                Row(verticalAlignment = Alignment.CenterVertically) {
                    if (combo.offer_enabled && combo.offer_price != null) {
                        Text(
                            text = "Offer: ₹${combo.offer_price.toInt()}",
                            fontSize = 14.sp,
                            fontWeight = FontWeight.ExtraBold,
                            color = MaterialTheme.colorScheme.primary
                        )
                    } else {
                        Text(
                            text = "Dine-In: ₹${combo.dine_in_price?.toInt() ?: combo.price.toInt()} • Parcel: ₹${combo.parcel_price?.toInt() ?: combo.price.toInt()}",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                    }
                }
            }

            Column(horizontalAlignment = Alignment.End) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        text = if (combo.available) "ON" else "OFF",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = if (combo.available) Color(0xFF2E7D32) else Color(0xFFC62828)
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Switch(
                        checked = combo.available,
                        onCheckedChange = { onToggleStatus() }
                    )
                }
                IconButton(onClick = onDelete, modifier = Modifier.size(28.dp)) {
                    Icon(Icons.Default.Delete, contentDescription = "Delete Combo", tint = Color.Gray, modifier = Modifier.size(18.dp))
                }
            }
        }
    }
}

@Composable
fun OfferCardRow(
    offer: Offer,
    onToggleStatus: () -> Unit,
    onDelete: () -> Unit
) {
    Card(
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(72.dp)
                    .clip(RoundedCornerShape(12.dp))
                    .background(Color(0xFFE8F5E9)),
                contentAlignment = Alignment.Center
            ) {
                if (!offer.image_url.isNullOrEmpty()) {
                    AsyncImage(
                        model = offer.image_url,
                        contentDescription = offer.title,
                        contentScale = ContentScale.Crop,
                        modifier = Modifier.fillMaxSize()
                    )
                } else {
                    Icon(
                        imageVector = Icons.Default.LocalOffer,
                        contentDescription = "Promotional Offer",
                        tint = Color(0xFF2E7D32),
                        modifier = Modifier.size(32.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.width(12.dp))

            Column(modifier = Modifier.weight(1f)) {
                Surface(
                    shape = RoundedCornerShape(4.dp),
                    color = Color(0xFF2E7D32),
                    modifier = Modifier.padding(bottom = 2.dp)
                ) {
                    Text("PROMOTIONAL OFFER", fontSize = 9.sp, fontWeight = FontWeight.Bold, color = Color.White, modifier = Modifier.padding(horizontal = 4.dp, vertical = 1.dp))
                }
                Text(text = offer.title, fontWeight = FontWeight.Bold, fontSize = 15.sp)

                if (!offer.description.isNullOrBlank()) {
                    Text(text = offer.description, fontSize = 11.sp, color = Color.Gray, maxLines = 1)
                }

                Spacer(modifier = Modifier.height(4.dp))
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        text = "₹${offer.offer_price?.toInt() ?: 99}",
                        fontSize = 15.sp,
                        fontWeight = FontWeight.ExtraBold,
                        color = MaterialTheme.colorScheme.primary
                    )
                    if (offer.price != null) {
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = "₹${offer.price.toInt()}",
                            fontSize = 12.sp,
                            color = Color.Gray,
                            textDecoration = TextDecoration.LineThrough
                        )
                    }
                }
            }

            Column(horizontalAlignment = Alignment.End) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        text = if (offer.available) "ON" else "OFF",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = if (offer.available) Color(0xFF2E7D32) else Color(0xFFC62828)
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Switch(
                        checked = offer.available,
                        onCheckedChange = { onToggleStatus() }
                    )
                }
                IconButton(onClick = onDelete, modifier = Modifier.size(28.dp)) {
                    Icon(Icons.Default.Delete, contentDescription = "Delete Offer", tint = Color.Gray, modifier = Modifier.size(18.dp))
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AddFoodDialog(
    onDismiss: () -> Unit,
    onAddMultipart: (
        name: String, category: String, foodType: String, price: Double, offerEnabled: Boolean, offerPrice: Double?,
        available: Boolean, onlineAvailable: Boolean, availableDays: String, imageFile: File?, mimeType: String, originalName: String?,
        onComplete: (Boolean, String?) -> Unit
    ) -> Unit
) {
    var name by remember { mutableStateOf("") }
    var selectedCategory by remember { mutableStateOf("Non-Veg") }
    var priceStr by remember { mutableStateOf("") }
    var offerEnabled by remember { mutableStateOf(false) }
    var offerPriceStr by remember { mutableStateOf("") }
    var onlineAvailable by remember { mutableStateOf(true) }
    var isSubmitting by remember { mutableStateOf(false) }

    var isEveryDay by remember { mutableStateOf(true) }
    var mon by remember { mutableStateOf(false) }
    var tue by remember { mutableStateOf(false) }
    var wed by remember { mutableStateOf(false) }
    var thu by remember { mutableStateOf(false) }
    var fri by remember { mutableStateOf(false) }
    var sat by remember { mutableStateOf(false) }
    var sun by remember { mutableStateOf(false) }

    var selectedUploadData by remember { mutableStateOf<UploadFileData?>(null) }
    val context = LocalContext.current

    val imagePickerLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri: Uri? ->
        if (uri != null) {
            val uploadData = uriToUploadFile(context, uri)
            if (uploadData != null) {
                selectedUploadData = uploadData
            }
        }
    }

    AlertDialog(
        onDismissRequest = { if (!isSubmitting) onDismiss() },
        title = { Text("Add New Food Item", fontWeight = FontWeight.Bold) },
        text = {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                OutlinedTextField(
                    value = name,
                    onValueChange = { name = it },
                    label = { Text("Item Name") },
                    singleLine = true,
                    enabled = !isSubmitting,
                    modifier = Modifier.fillMaxWidth()
                )

                Text("Category:", fontWeight = FontWeight.Bold, fontSize = 13.sp)
                // Row 1: Non-Veg, Veg, Egg Items
                Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    listOf("Non-Veg", "Veg", "Egg Items").forEach { cat ->
                        FilterChip(
                            selected = selectedCategory == cat,
                            onClick = { if (!isSubmitting) selectedCategory = cat },
                            label = { Text(cat, fontSize = 11.sp, fontWeight = FontWeight.Bold) },
                            enabled = !isSubmitting
                        )
                    }
                }
                // Row 2: Snacks
                Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    FilterChip(
                        selected = selectedCategory == "Snacks",
                        onClick = { if (!isSubmitting) selectedCategory = "Snacks" },
                        label = { Text("🍟 Snacks", fontSize = 11.sp, fontWeight = FontWeight.Bold) },
                        enabled = !isSubmitting
                    )
                }

                OutlinedTextField(
                    value = priceStr,
                    onValueChange = { priceStr = it },
                    label = { Text("Price (₹)") },
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                    enabled = !isSubmitting,
                    modifier = Modifier.fillMaxWidth()
                )

                Row(verticalAlignment = Alignment.CenterVertically) {
                    Switch(checked = onlineAvailable, onCheckedChange = { onlineAvailable = it }, enabled = !isSubmitting)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Online Order Available", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                }

                Text("Available Days (Checkboxes):", fontWeight = FontWeight.Bold, fontSize = 13.sp)
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Checkbox(
                        checked = isEveryDay,
                        onCheckedChange = {
                            isEveryDay = it
                            if (it) {
                                mon = false; tue = false; wed = false; thu = false; fri = false; sat = false; sun = false
                            }
                        },
                        enabled = !isSubmitting
                    )
                    Text("Every Day", fontWeight = FontWeight.Bold, fontSize = 12.sp)
                }

                if (!isEveryDay) {
                    Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
                        val dayPairs = listOf(
                            "Monday" to mon, "Tuesday" to tue, "Wednesday" to wed,
                            "Thursday" to thu, "Friday" to fri, "Saturday" to sat, "Sunday" to sun
                        )
                        dayPairs.chunked(2).forEach { rowDays ->
                            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                rowDays.forEach { (dayName, isChecked) ->
                                    Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.weight(1f)) {
                                        Checkbox(
                                            checked = isChecked,
                                            onCheckedChange = { checked ->
                                                when (dayName) {
                                                    "Monday" -> mon = checked
                                                    "Tuesday" -> tue = checked
                                                    "Wednesday" -> wed = checked
                                                    "Thursday" -> thu = checked
                                                    "Friday" -> fri = checked
                                                    "Saturday" -> sat = checked
                                                    "Sunday" -> sun = checked
                                                }
                                            },
                                            enabled = !isSubmitting
                                        )
                                        Text(dayName, fontSize = 11.sp)
                                    }
                                }
                            }
                        }
                    }
                }

                Row(verticalAlignment = Alignment.CenterVertically) {
                    Checkbox(checked = offerEnabled, onCheckedChange = { offerEnabled = it }, enabled = !isSubmitting)
                    Text("Offer Price Enabled", fontSize = 12.sp)
                }

                if (offerEnabled) {
                    OutlinedTextField(
                        value = offerPriceStr,
                        onValueChange = { offerPriceStr = it },
                        label = { Text("Offer Price (₹)") },
                        singleLine = true,
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                        enabled = !isSubmitting,
                        modifier = Modifier.fillMaxWidth()
                    )
                }

                Spacer(modifier = Modifier.height(4.dp))
                Button(
                    onClick = { imagePickerLauncher.launch("image/*") },
                    enabled = !isSubmitting,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Icon(Icons.Default.Image, contentDescription = null)
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(if (selectedUploadData != null) "Selected: ${selectedUploadData?.originalName}" else "Select Image File")
                }
            }
        },
        confirmButton = {
            Button(
                enabled = !isSubmitting,
                onClick = {
                    val p = priceStr.toDoubleOrNull()
                    if (name.isBlank() || p == null) {
                        Toast.makeText(context, "Please enter valid Name and Price", Toast.LENGTH_SHORT).show()
                        return@Button
                    }
                    val formattedDays = if (isEveryDay) {
                        "Every Day"
                    } else {
                        val selectedList = mutableListOf<String>()
                        if (mon) selectedList.add("Monday")
                        if (tue) selectedList.add("Tuesday")
                        if (wed) selectedList.add("Wednesday")
                        if (thu) selectedList.add("Thursday")
                        if (fri) selectedList.add("Friday")
                        if (sat) selectedList.add("Saturday")
                        if (sun) selectedList.add("Sunday")
                        if (selectedList.isEmpty()) "Every Day" else selectedList.joinToString(", ")
                    }

                    val op = if (offerEnabled) offerPriceStr.toDoubleOrNull() else null
                    val foodType = when (selectedCategory) {
                        "Veg" -> "Veg"
                        "Non-Veg" -> "Non-Veg"
                        "Egg Items" -> "Egg"
                        "Snacks" -> "Veg"
                        else -> "Veg"
                    }
                    isSubmitting = true
                    onAddMultipart(
                        name.trim(), selectedCategory, foodType, p, offerEnabled, op, true, onlineAvailable, formattedDays,
                        selectedUploadData?.file, selectedUploadData?.mimeType ?: "image/jpeg", selectedUploadData?.originalName
                    ) { success, _ ->
                        isSubmitting = false
                        if (success) {
                            onDismiss()
                        }
                    }
                }
            ) {
                if (isSubmitting) {
                    CircularProgressIndicator(modifier = Modifier.size(16.dp), color = Color.White, strokeWidth = 2.dp)
                    Spacer(modifier = Modifier.width(6.dp))
                    Text("Saving...")
                } else {
                    Text("Save Item")
                }
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss, enabled = !isSubmitting) {
                Text("Cancel")
            }
        }
    )
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AddComboDialog(
    catalogFoods: List<FoodItem>,
    onDismiss: () -> Unit,
    onCreateCombo: (ComboCreateRequest) -> Unit
) {
    var dineInPriceStr by remember { mutableStateOf("") }
    var parcelPriceStr by remember { mutableStateOf("") }
    var offerEnabled by remember { mutableStateOf(false) }
    var offerPriceStr by remember { mutableStateOf("") }

    val selectedQuantities = remember { mutableStateMapOf<String, Int>() }
    val context = LocalContext.current

    val selectedFoods = catalogFoods.filter { (selectedQuantities[it.id] ?: 0) > 0 }
    val autoComboName = selectedFoods.joinToString(" + ") { it.name }
    val originalSumPrice = selectedFoods.sumOf { it.price * (selectedQuantities[it.id] ?: 1) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Create New Combo Package", fontWeight = FontWeight.Bold) },
        text = {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .heightIn(max = 420.dp)
                    .verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                // Auto-Generated Name Preview Box
                Surface(
                    shape = RoundedCornerShape(12.dp),
                    color = Color(0xFFFFF8E1),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(12.dp)) {
                        Text("AUTO-GENERATED COMBO NAME:", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = Color(0xFFE65100))
                        Text(
                            text = if (autoComboName.isNotBlank()) autoComboName else "Select items below to form combo name...",
                            fontSize = 14.sp,
                            fontWeight = FontWeight.ExtraBold,
                            color = Color(0xFF3E2723)
                        )
                        if (originalSumPrice > 0) {
                            Spacer(modifier = Modifier.height(4.dp))
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Text("Original Items Total: ", fontSize = 11.sp, color = Color.Gray)
                                Text("₹${originalSumPrice.toInt()}", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Color.Gray)
                            }
                        }
                    }
                }

                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(
                        value = dineInPriceStr,
                        onValueChange = { dineInPriceStr = it },
                        label = { Text("Dine-In Price (₹)") },
                        singleLine = true,
                        modifier = Modifier.weight(1f)
                    )
                    OutlinedTextField(
                        value = parcelPriceStr,
                        onValueChange = { parcelPriceStr = it },
                        label = { Text("Parcel Price (₹)") },
                        singleLine = true,
                        modifier = Modifier.weight(1f)
                    )
                }

                Row(verticalAlignment = Alignment.CenterVertically) {
                    Checkbox(checked = offerEnabled, onCheckedChange = { offerEnabled = it })
                    Text("Combo Offer Price Enabled", fontSize = 12.sp)
                }

                if (offerEnabled) {
                    OutlinedTextField(
                        value = offerPriceStr,
                        onValueChange = { offerPriceStr = it },
                        label = { Text("Offer Price (₹) (e.g. ₹99)") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )
                }

                Text("Check/Select Items for Combo:", fontWeight = FontWeight.Bold, fontSize = 13.sp)

                catalogFoods.forEach { food ->
                    val qty = selectedQuantities[food.id] ?: 0
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 2.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("${food.name} (₹${food.price.toInt()})", fontSize = 12.sp, modifier = Modifier.weight(1f))
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            IconButton(
                                onClick = {
                                    if (qty > 1) selectedQuantities[food.id] = qty - 1
                                    else selectedQuantities.remove(food.id)
                                },
                                modifier = Modifier.size(24.dp)
                            ) {
                                Icon(Icons.Default.Remove, contentDescription = null, modifier = Modifier.size(14.dp))
                            }
                            Text("$qty", fontSize = 12.sp, fontWeight = FontWeight.Bold, modifier = Modifier.padding(horizontal = 6.dp))
                            IconButton(
                                onClick = { selectedQuantities[food.id] = qty + 1 },
                                modifier = Modifier.size(24.dp)
                            ) {
                                Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.size(14.dp))
                            }
                        }
                    }
                }
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    val dinePrice = dineInPriceStr.toDoubleOrNull() ?: originalSumPrice
                    val parcelPrice = parcelPriceStr.toDoubleOrNull() ?: dinePrice
                    if (selectedFoods.isEmpty()) {
                        Toast.makeText(context, "Please select at least one item for the combo", Toast.LENGTH_SHORT).show()
                        return@Button
                    }
                    val selectedItems = selectedQuantities.map { (id, q) -> ComboItemInput(food_item_id = id, quantity = q) }
                    val op = if (offerEnabled) offerPriceStr.toDoubleOrNull() else null
                    onCreateCombo(
                        ComboCreateRequest(
                            name = autoComboName,
                            price = originalSumPrice,
                            dine_in_price = dinePrice,
                            parcel_price = parcelPrice,
                            offer_enabled = offerEnabled,
                            offer_price = op,
                            available = true,
                            combo_items = selectedItems
                        )
                    )
                }
            ) {
                Text("Save Combo")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel")
            }
        }
    )
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AddOfferDialog(
    catalogFoods: List<FoodItem>,
    onDismiss: () -> Unit,
    onCreateOffer: (OfferCreateRequest) -> Unit
) {
    var titleTag by remember { mutableStateOf("") }
    var description by remember { mutableStateOf("") }
    var offerPriceStr by remember { mutableStateOf("99") }

    val selectedFoodIds = remember { mutableStateListOf<String>() }
    val context = LocalContext.current

    val selectedFoods = catalogFoods.filter { selectedFoodIds.contains(it.id) }
    val autoItemsTitle = selectedFoods.joinToString(" + ") { it.name }
    val fullTitle = if (titleTag.isNotBlank() && autoItemsTitle.isNotBlank()) "${titleTag.trim()}: $autoItemsTitle" else if (titleTag.isNotBlank()) titleTag.trim() else autoItemsTitle
    val originalSumPrice = selectedFoods.sumOf { it.price }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Create Promotional Offer", fontWeight = FontWeight.Bold) },
        text = {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .heightIn(max = 420.dp)
                    .verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                OutlinedTextField(
                    value = titleTag,
                    onValueChange = { titleTag = it },
                    label = { Text("Offer Tag Name (e.g. Weekend Deal, ₹99 Offer)") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )

                // Live Title & Pricing Preview Box
                Surface(
                    shape = RoundedCornerShape(12.dp),
                    color = Color(0xFFE8F5E9),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(12.dp)) {
                        Text("LIVE OFFER PREVIEW:", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = Color(0xFF2E7D32))
                        Text(
                            text = if (fullTitle.isNotBlank()) fullTitle else "Select items below to form offer...",
                            fontSize = 14.sp,
                            fontWeight = FontWeight.ExtraBold,
                            color = Color(0xFF1B5E20)
                        )
                        if (originalSumPrice > 0) {
                            Spacer(modifier = Modifier.height(4.dp))
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Text("Original Total: ", fontSize = 11.sp, color = Color.Gray)
                                Text("₹${originalSumPrice.toInt()}", fontSize = 12.sp, color = Color.Gray, textDecoration = TextDecoration.LineThrough)
                                Spacer(modifier = Modifier.width(6.dp))
                                Text("→ Offer: ₹${offerPriceStr}", fontSize = 13.sp, fontWeight = FontWeight.ExtraBold, color = Color(0xFF2E7D32))
                            }
                        }
                    }
                }

                OutlinedTextField(
                    value = offerPriceStr,
                    onValueChange = { offerPriceStr = it },
                    label = { Text("Special Offer Price (₹)") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )

                OutlinedTextField(
                    value = description,
                    onValueChange = { description = it },
                    label = { Text("Offer Description (Optional)") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )

                Text("Check Items Included in this Offer:", fontWeight = FontWeight.Bold, fontSize = 13.sp)

                catalogFoods.forEach { food ->
                    val isChecked = selectedFoodIds.contains(food.id)
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable {
                                if (isChecked) selectedFoodIds.remove(food.id)
                                else selectedFoodIds.add(food.id)
                            }
                            .padding(vertical = 4.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Checkbox(
                            checked = isChecked,
                            onCheckedChange = { checked ->
                                if (checked) selectedFoodIds.add(food.id)
                                else selectedFoodIds.remove(food.id)
                            }
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("${food.name} (₹${food.price.toInt()})", fontSize = 12.sp)
                    }
                }
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    val op = offerPriceStr.toDoubleOrNull() ?: 99.0
                    if (titleTag.isBlank() && autoItemsTitle.isBlank()) {
                        Toast.makeText(context, "Please enter Offer Tag Name or select items", Toast.LENGTH_SHORT).show()
                        return@Button
                    }
                    onCreateOffer(
                        OfferCreateRequest(
                            title = fullTitle,
                            description = description.ifBlank { null },
                            price = if (originalSumPrice > 0) originalSumPrice else null,
                            offer_enabled = true,
                            offer_price = op,
                            available = true
                        )
                    )
                }
            ) {
                Text("Save Offer")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel")
            }
        }
    )
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun EditFoodDialog(
    food: FoodItem,
    onDismiss: () -> Unit,
    onUpdateMultipart: (
        id: String, name: String, category: String, foodType: String, price: Double, offerEnabled: Boolean, offerPrice: Double?,
        available: Boolean, onlineAvailable: Boolean, availableDays: String, imageFile: File?, mimeType: String, originalName: String?,
        onComplete: (Boolean, String?) -> Unit
    ) -> Unit
) {
    var name by remember { mutableStateOf(food.name) }
    var selectedCategory by remember { mutableStateOf(food.category.ifBlank { "Non-Veg" }) }
    var priceStr by remember { mutableStateOf(food.price.toInt().toString()) }
    var offerEnabled by remember { mutableStateOf(food.offer_enabled) }
    var offerPriceStr by remember { mutableStateOf(food.offer_price?.toInt()?.toString() ?: "") }
    var onlineAvailable by remember { mutableStateOf(food.online_available) }
    var isSubmitting by remember { mutableStateOf(false) }

    val rawDays = food.available_days ?: "Every Day"
    var isEveryDay by remember { mutableStateOf(rawDays.contains("Every Day", ignoreCase = true)) }
    var mon by remember { mutableStateOf(rawDays.contains("Monday", ignoreCase = true)) }
    var tue by remember { mutableStateOf(rawDays.contains("Tuesday", ignoreCase = true)) }
    var wed by remember { mutableStateOf(rawDays.contains("Wednesday", ignoreCase = true)) }
    var thu by remember { mutableStateOf(rawDays.contains("Thursday", ignoreCase = true)) }
    var fri by remember { mutableStateOf(rawDays.contains("Friday", ignoreCase = true)) }
    var sat by remember { mutableStateOf(rawDays.contains("Saturday", ignoreCase = true)) }
    var sun by remember { mutableStateOf(rawDays.contains("Sunday", ignoreCase = true)) }

    var selectedUploadData by remember { mutableStateOf<UploadFileData?>(null) }
    val context = LocalContext.current

    val imagePickerLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri: Uri? ->
        if (uri != null) {
            val uploadData = uriToUploadFile(context, uri)
            if (uploadData != null) {
                selectedUploadData = uploadData
            }
        }
    }

    AlertDialog(
        onDismissRequest = { if (!isSubmitting) onDismiss() },
        title = { Text("Edit Food Item: ${food.name}", fontWeight = FontWeight.Bold, fontSize = 16.sp) },
        text = {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                OutlinedTextField(
                    value = name,
                    onValueChange = { name = it },
                    label = { Text("Item Name") },
                    singleLine = true,
                    enabled = !isSubmitting,
                    modifier = Modifier.fillMaxWidth()
                )

                Text("Category:", fontWeight = FontWeight.Bold, fontSize = 13.sp)
                // Row 1: Non-Veg, Veg, Egg Items
                Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    listOf("Non-Veg", "Veg", "Egg Items").forEach { cat ->
                        FilterChip(
                            selected = selectedCategory == cat,
                            onClick = { if (!isSubmitting) selectedCategory = cat },
                            label = { Text(cat, fontSize = 11.sp, fontWeight = FontWeight.Bold) },
                            enabled = !isSubmitting
                        )
                    }
                }
                // Row 2: Snacks
                Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    FilterChip(
                        selected = selectedCategory == "Snacks",
                        onClick = { if (!isSubmitting) selectedCategory = "Snacks" },
                        label = { Text("🍟 Snacks", fontSize = 11.sp, fontWeight = FontWeight.Bold) },
                        enabled = !isSubmitting
                    )
                }

                OutlinedTextField(
                    value = priceStr,
                    onValueChange = { priceStr = it },
                    label = { Text("Price (₹)") },
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                    enabled = !isSubmitting,
                    modifier = Modifier.fillMaxWidth()
                )

                Row(verticalAlignment = Alignment.CenterVertically) {
                    Switch(checked = onlineAvailable, onCheckedChange = { onlineAvailable = it }, enabled = !isSubmitting)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Online Order Available", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                }

                Text("Available Days (Checkboxes):", fontWeight = FontWeight.Bold, fontSize = 13.sp)
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Checkbox(
                        checked = isEveryDay,
                        onCheckedChange = {
                            isEveryDay = it
                            if (it) {
                                mon = false; tue = false; wed = false; thu = false; fri = false; sat = false; sun = false
                            }
                        },
                        enabled = !isSubmitting
                    )
                    Text("Every Day", fontWeight = FontWeight.Bold, fontSize = 12.sp)
                }

                if (!isEveryDay) {
                    Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
                        val dayPairs = listOf(
                            "Monday" to mon, "Tuesday" to tue, "Wednesday" to wed,
                            "Thursday" to thu, "Friday" to fri, "Saturday" to sat, "Sunday" to sun
                        )
                        dayPairs.chunked(2).forEach { rowDays ->
                            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                rowDays.forEach { (dayName, isChecked) ->
                                    Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.weight(1f)) {
                                        Checkbox(
                                            checked = isChecked,
                                            onCheckedChange = { checked ->
                                                when (dayName) {
                                                    "Monday" -> mon = checked
                                                    "Tuesday" -> tue = checked
                                                    "Wednesday" -> wed = checked
                                                    "Thursday" -> thu = checked
                                                    "Friday" -> fri = checked
                                                    "Saturday" -> sat = checked
                                                    "Sunday" -> sun = checked
                                                }
                                            },
                                            enabled = !isSubmitting
                                        )
                                        Text(dayName, fontSize = 11.sp)
                                    }
                                }
                            }
                        }
                    }
                }

                Row(verticalAlignment = Alignment.CenterVertically) {
                    Checkbox(checked = offerEnabled, onCheckedChange = { offerEnabled = it }, enabled = !isSubmitting)
                    Text("Offer Price Enabled", fontSize = 12.sp)
                }

                if (offerEnabled) {
                    OutlinedTextField(
                        value = offerPriceStr,
                        onValueChange = { offerPriceStr = it },
                        label = { Text("Offer Price (₹)") },
                        singleLine = true,
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                        enabled = !isSubmitting,
                        modifier = Modifier.fillMaxWidth()
                    )
                }

                Spacer(modifier = Modifier.height(4.dp))

                if (!food.image_url.isNullOrEmpty()) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text("Current Image: ", fontSize = 11.sp, color = Color.Gray)
                        AsyncImage(
                            model = food.image_url,
                            contentDescription = null,
                            modifier = Modifier.size(36.dp).clip(RoundedCornerShape(6.dp)),
                            contentScale = ContentScale.Crop
                        )
                    }
                }

                Button(
                    onClick = { imagePickerLauncher.launch("image/*") },
                    enabled = !isSubmitting,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Icon(Icons.Default.Image, contentDescription = null)
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(if (selectedUploadData != null) "New: ${selectedUploadData?.originalName}" else "Replace Cloudinary Image File")
                }
            }
        },
        confirmButton = {
            Button(
                enabled = !isSubmitting,
                onClick = {
                    val p = priceStr.toDoubleOrNull()
                    if (name.isBlank() || p == null) {
                        Toast.makeText(context, "Please enter valid Name and Price", Toast.LENGTH_SHORT).show()
                        return@Button
                    }
                    val formattedDays = if (isEveryDay) {
                        "Every Day"
                    } else {
                        val selectedList = mutableListOf<String>()
                        if (mon) selectedList.add("Monday")
                        if (tue) selectedList.add("Tuesday")
                        if (wed) selectedList.add("Wednesday")
                        if (thu) selectedList.add("Thursday")
                        if (fri) selectedList.add("Friday")
                        if (sat) selectedList.add("Saturday")
                        if (sun) selectedList.add("Sunday")
                        if (selectedList.isEmpty()) "Every Day" else selectedList.joinToString(", ")
                    }

                    val op = if (offerEnabled) offerPriceStr.toDoubleOrNull() else null
                    val foodType = when (selectedCategory) {
                        "Veg" -> "Veg"
                        "Non-Veg" -> "Non-Veg"
                        "Egg Items" -> "Egg"
                        "Snacks" -> "Veg"
                        else -> "Veg"
                    }
                    isSubmitting = true
                    onUpdateMultipart(
                        food.id, name.trim(), selectedCategory, foodType, p, offerEnabled, op, food.available, onlineAvailable, formattedDays,
                        selectedUploadData?.file, selectedUploadData?.mimeType ?: "image/jpeg", selectedUploadData?.originalName
                    ) { success, _ ->
                        isSubmitting = false
                        if (success) {
                            onDismiss()
                        }
                    }
                }
            ) {
                if (isSubmitting) {
                    CircularProgressIndicator(modifier = Modifier.size(16.dp), color = Color.White, strokeWidth = 2.dp)
                    Spacer(modifier = Modifier.width(6.dp))
                    Text("Updating...")
                } else {
                    Text("Update Item")
                }
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss, enabled = !isSubmitting) {
                Text("Cancel")
            }
        }
    )
}
