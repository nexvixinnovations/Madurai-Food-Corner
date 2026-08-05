package com.maduraifoodcorner.admin.ui.navigation

import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.navArgument
import com.maduraifoodcorner.admin.ui.screens.about.AboutScreen
import com.maduraifoodcorner.admin.ui.screens.billing.BillingScreen
import com.maduraifoodcorner.admin.ui.screens.combos.CombosScreen
import com.maduraifoodcorner.admin.ui.screens.dashboard.DashboardScreen
import com.maduraifoodcorner.admin.ui.screens.foods.FoodsScreen
import com.maduraifoodcorner.admin.ui.screens.menu.MenuScheduleScreen
import com.maduraifoodcorner.admin.ui.screens.notifications.NotificationsScreen
import com.maduraifoodcorner.admin.ui.screens.offers.SpecialOffersScreen
import com.maduraifoodcorner.admin.ui.screens.orders.OrderDetailsScreen
import com.maduraifoodcorner.admin.ui.screens.orders.OrdersScreen
import com.maduraifoodcorner.admin.ui.screens.payments.PaymentsScreen
import com.maduraifoodcorner.admin.ui.screens.printer.PrinterSettingsScreen
import com.maduraifoodcorner.admin.ui.screens.reports.ReportsScreen
import com.maduraifoodcorner.admin.ui.screens.settings.SettingsScreen

@Composable
fun NavGraph(
    navController: NavHostController,
    onOpenDrawer: () -> Unit,
    modifier: Modifier = Modifier
) {
    NavHost(
        navController = navController,
        startDestination = Screen.Dashboard.route,
        modifier = modifier
    ) {
        composable(Screen.Dashboard.route) {
            DashboardScreen(
                onOpenDrawer = onOpenDrawer,
                onNavigateToOrders = { navController.navigate(Screen.Orders.route) },
                onNavigateToFoods = { navController.navigate(Screen.Foods.route) }
            )
        }

        composable(Screen.Orders.route) {
            OrdersScreen(
                onOpenDrawer = onOpenDrawer,
                onOrderClick = { orderId ->
                    navController.navigate(Screen.OrderDetails.createRoute(orderId))
                }
            )
        }

        composable(
            route = Screen.OrderDetails.route,
            arguments = listOf(navArgument("orderId") { type = NavType.StringType })
        ) { backStackEntry ->
            val orderId = backStackEntry.arguments?.getString("orderId") ?: ""
            OrderDetailsScreen(
                orderId = orderId,
                onBack = { navController.popBackStack() }
            )
        }

        composable(Screen.Foods.route) {
            FoodsScreen(onOpenDrawer = onOpenDrawer)
        }

        composable(Screen.Billing.route) {
            BillingScreen(onOpenDrawer = onOpenDrawer)
        }

        composable(Screen.MenuSchedule.route) {
            MenuScheduleScreen(onOpenDrawer = onOpenDrawer)
        }

        composable(Screen.Combos.route) {
            CombosScreen(onOpenDrawer = onOpenDrawer)
        }

        composable(Screen.SpecialOffers.route) {
            SpecialOffersScreen(onOpenDrawer = onOpenDrawer)
        }

        composable(Screen.Payments.route) {
            PaymentsScreen(onOpenDrawer = onOpenDrawer)
        }

        composable(Screen.Reports.route) {
            ReportsScreen(onOpenDrawer = onOpenDrawer)
        }

        composable(Screen.Settings.route) {
            SettingsScreen(onOpenDrawer = onOpenDrawer)
        }

        composable(Screen.Notifications.route) {
            NotificationsScreen(onOpenDrawer = onOpenDrawer)
        }

        composable(Screen.PrinterSettings.route) {
            PrinterSettingsScreen(onOpenDrawer = onOpenDrawer)
        }

        composable(Screen.About.route) {
            AboutScreen(onOpenDrawer = onOpenDrawer)
        }
    }
}
