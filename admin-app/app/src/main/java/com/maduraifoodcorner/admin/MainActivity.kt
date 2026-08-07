package com.maduraifoodcorner.admin

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.maduraifoodcorner.admin.ui.components.AppBottomBar
import com.maduraifoodcorner.admin.ui.components.AppDrawerContent
import com.maduraifoodcorner.admin.ui.navigation.NavGraph
import com.maduraifoodcorner.admin.ui.navigation.Screen
import com.maduraifoodcorner.admin.ui.theme.MaduraiFoodCornerAdminTheme
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.launch

@AndroidEntryPoint
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            MaduraiFoodCornerAdminTheme {
                val navController = rememberNavController()
                val drawerState = rememberDrawerState(initialValue = DrawerValue.Closed)
                val scope = rememberCoroutineScope()

                val navBackStackEntry by navController.currentBackStackEntryAsState()
                val currentRoute = navBackStackEntry?.destination?.route

                ModalNavigationDrawer(
                    drawerState = drawerState,
                    drawerContent = {
                        AppDrawerContent(
                            currentRoute = currentRoute,
                            onNavigate = { screen ->
                                if (currentRoute != screen.route) {
                                    navController.navigate(screen.route) {
                                        popUpTo(navController.graph.startDestinationId) { saveState = true }
                                        launchSingleTop = true
                                        restoreState = true
                                    }
                                }
                            },
                            onCloseDrawer = {
                                scope.launch { drawerState.close() }
                            }
                        )
                    }
                ) {
                    Scaffold(
                        bottomBar = {
                            if (currentRoute in listOf(
                                    Screen.Dashboard.route,
                                    Screen.Orders.route,
                                    Screen.Foods.route,
                                    Screen.Reports.route,
                                    Screen.Settings.route
                                )
                            ) {
                                AppBottomBar(navController = navController)
                            }
                        }
                    ) { padding ->
                        NavGraph(
                            navController = navController,
                            onOpenDrawer = {
                                scope.launch { drawerState.open() }
                            },
                            modifier = Modifier
                                .fillMaxSize()
                                .padding(padding)
                        )
                    }
                }
            }
        }
    }
}
