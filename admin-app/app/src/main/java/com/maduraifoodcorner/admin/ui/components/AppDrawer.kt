package com.maduraifoodcorner.admin.ui.components

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.maduraifoodcorner.admin.R
import com.maduraifoodcorner.admin.ui.navigation.Screen

@Composable
fun AppDrawerContent(
    currentRoute: String?,
    onNavigate: (Screen) -> Unit,
    onCloseDrawer: () -> Unit
) {
    val drawerItems = listOf(
        Screen.Dashboard to Icons.Default.Dashboard,
        Screen.Orders to Icons.Default.ShoppingCart,
        Screen.Foods to Icons.Default.RestaurantMenu,
        Screen.MenuSchedule to Icons.Default.CalendarMonth,
        Screen.Combos to Icons.Default.TakeoutDining,
        Screen.SpecialOffers to Icons.Default.LocalOffer,
        Screen.Payments to Icons.Default.Payments,
        Screen.Reports to Icons.Default.BarChart,
        Screen.Settings to Icons.Default.Settings,
        Screen.Notifications to Icons.Default.Notifications,
        Screen.PrinterSettings to Icons.Default.Print,
        Screen.About to Icons.Default.Info
    )

    ModalDrawerSheet(
        modifier = Modifier.width(300.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
        ) {
            // Header Drawer Card with Logo
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(MaterialTheme.colorScheme.primary)
                    .padding(24.dp)
            ) {
                Column(horizontalAlignment = Alignment.Start) {
                    Image(
                        painter = painterResource(id = R.drawable.logo),
                        contentDescription = "Madurai Food Corner Logo",
                        modifier = Modifier
                            .size(64.dp)
                            .clip(CircleShape)
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                    Text(
                        text = "MADURAI FOOD CORNER",
                        color = MaterialTheme.colorScheme.onPrimary,
                        fontWeight = FontWeight.Bold,
                        fontSize = 16.sp
                    )
                    Text(
                        text = "Taste the Pride of Madurai",
                        color = MaterialTheme.colorScheme.onPrimary.copy(alpha = 0.8f),
                        fontSize = 11.sp
                    )
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Navigation Drawer Items
            drawerItems.forEach { (screen, icon) ->
                NavigationDrawerItem(
                    icon = { Icon(icon, contentDescription = screen.title) },
                    label = { Text(screen.title) },
                    selected = currentRoute == screen.route,
                    onClick = {
                        onCloseDrawer()
                        onNavigate(screen)
                    },
                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 2.dp)
                )
            }
        }
    }
}
