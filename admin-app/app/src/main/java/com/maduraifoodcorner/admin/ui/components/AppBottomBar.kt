package com.maduraifoodcorner.admin.ui.components

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.unit.dp
import androidx.navigation.NavController
import androidx.navigation.compose.currentBackStackEntryAsState
import com.maduraifoodcorner.admin.ui.navigation.Screen

import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.sp

@Composable
fun AppBottomBar(navController: NavController) {
    val items = listOf(
        Screen.Dashboard to Icons.Default.Dashboard,
        Screen.Orders to Icons.Default.ShoppingCart,
        Screen.Billing to Icons.Default.ReceiptLong,
        Screen.Foods to Icons.Default.RestaurantMenu,
        Screen.Reports to Icons.Default.BarChart,
        Screen.Settings to Icons.Default.Settings
    )

    val navBackStackEntry = navController.currentBackStackEntryAsState()
    val currentRoute = navBackStackEntry.value?.destination?.route

    NavigationBar(
        containerColor = MaterialTheme.colorScheme.surface,
        tonalElevation = 8.dp
    ) {
        items.forEach { (screen, icon) ->
            NavigationBarItem(
                icon = { Icon(icon, contentDescription = screen.title) },
                label = {
                    Text(
                        text = screen.shortTitle,
                        maxLines = 1,
                        fontSize = 10.sp,
                        softWrap = false,
                        overflow = TextOverflow.Ellipsis
                    )
                },
                selected = currentRoute == screen.route,
                onClick = {
                    if (currentRoute != screen.route) {
                        navController.navigate(screen.route) {
                            popUpTo(navController.graph.startDestinationId) { saveState = true }
                            launchSingleTop = true
                            restoreState = true
                        }
                    }
                }
            )
        }
    }
}
