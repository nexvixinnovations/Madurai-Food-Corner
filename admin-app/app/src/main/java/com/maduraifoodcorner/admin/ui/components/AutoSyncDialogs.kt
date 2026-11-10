package com.maduraifoodcorner.admin.ui.components

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import com.maduraifoodcorner.admin.data.offline.SyncResult

@Composable
fun AutoSyncConfirmationDialog(
    pendingOrdersCount: Int,
    pendingTotalAmount: Double,
    connectionType: String,
    countdownSeconds: Int,
    onConfirm: () -> Unit,
    onCancel: () -> Unit
) {
    val progress = (countdownSeconds / 30f).coerceIn(0f, 1f)
    val animatedProgress by animateFloatAsState(targetValue = progress, label = "countdown_progress")

    AlertDialog(
        onDismissRequest = { /* user must tap one of the buttons */ },
        icon = {
            Box(
                modifier = Modifier
                    .size(54.dp)
                    .clip(RoundedCornerShape(27.dp))
                    .background(Color(0xFFE8F5E9)),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = Icons.Default.Wifi,
                    contentDescription = null,
                    tint = Color(0xFF2E7D32),
                    modifier = Modifier.size(30.dp)
                )
            }
        },
        title = {
            Text(
                text = "Network Connected!",
                fontWeight = FontWeight.Bold,
                fontSize = 19.sp,
                textAlign = TextAlign.Center,
                modifier = Modifier.fillMaxWidth()
            )
        },
        text = {
            Column(
                modifier = Modifier.fillMaxWidth(),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                Text(
                    text = "Connected via $connectionType",
                    fontSize = 12.sp,
                    color = Color(0xFF2E7D32),
                    fontWeight = FontWeight.SemiBold
                )

                Card(
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)),
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(
                        modifier = Modifier.padding(12.dp),
                        verticalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        Text(
                            text = "$pendingOrdersCount Offline Bill(s) Ready to Upload",
                            fontWeight = FontWeight.Bold,
                            fontSize = 14.sp
                        )
                        Text(
                            text = "Total Amount: Rs. ${"%.2f".format(pendingTotalAmount)}",
                            fontSize = 13.sp,
                            color = MaterialTheme.colorScheme.primary,
                            fontWeight = FontWeight.SemiBold
                        )
                    }
                }

                Spacer(modifier = Modifier.height(4.dp))

                Text(
                    text = "Automatic upload in $countdownSeconds seconds",
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Bold,
                    color = if (countdownSeconds <= 10) Color(0xFFD32F2F) else MaterialTheme.colorScheme.onSurface
                )

                LinearProgressIndicator(
                    progress = { animatedProgress },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(8.dp)
                        .clip(RoundedCornerShape(4.dp)),
                    color = if (countdownSeconds <= 10) Color(0xFFD32F2F) else MaterialTheme.colorScheme.primary,
                    trackColor = MaterialTheme.colorScheme.surfaceVariant
                )

                Text(
                    text = "You can upload now or cancel to upload later manually.",
                    fontSize = 11.sp,
                    color = Color.Gray,
                    textAlign = TextAlign.Center
                )
            }
        },
        confirmButton = {
            Button(
                onClick = onConfirm,
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF2E7D32))
            ) {
                Icon(Icons.Default.CloudUpload, contentDescription = null, modifier = Modifier.size(16.dp))
                Spacer(modifier = Modifier.width(6.dp))
                Text("Upload Now")
            }
        },
        dismissButton = {
            OutlinedButton(onClick = onCancel) {
                Text("Cancel / Later")
            }
        }
    )
}

@Composable
fun AutoSyncProgressDialog(
    current: Int,
    total: Int
) {
    Dialog(onDismissRequest = { /* Prevent dismiss while syncing */ }) {
        Card(
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
            modifier = Modifier.padding(16.dp)
        ) {
            Column(
                modifier = Modifier.padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                CircularProgressIndicator(modifier = Modifier.size(48.dp))
                Text(
                    text = "Uploading Offline Bills to Server...",
                    fontWeight = FontWeight.Bold,
                    fontSize = 15.sp
                )
                Text(
                    text = "Uploading bill $current of $total",
                    fontSize = 13.sp,
                    color = Color.Gray
                )
                val fraction = if (total > 0) current.toFloat() / total.toFloat() else 0f
                LinearProgressIndicator(
                    progress = { fraction },
                    modifier = Modifier.fillMaxWidth().height(6.dp).clip(RoundedCornerShape(3.dp))
                )
            }
        }
    }
}

@Composable
fun AutoSyncResultDialog(
    result: SyncResult,
    onDismiss: () -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        icon = {
            Icon(
                imageVector = if (result.failedCount == 0) Icons.Default.CheckCircle else Icons.Default.Warning,
                contentDescription = null,
                tint = if (result.failedCount == 0) Color(0xFF2E7D32) else Color(0xFFF57C00),
                modifier = Modifier.size(48.dp)
            )
        },
        title = {
            Text(
                text = if (result.failedCount == 0) "Bills Uploaded Successfully!" else "Upload Completed with Warnings",
                fontWeight = FontWeight.Bold,
                fontSize = 18.sp,
                textAlign = TextAlign.Center
            )
        },
        text = {
            Column(
                modifier = Modifier.fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text("Total Bills Uploaded:", fontSize = 13.sp)
                    Text("${result.successCount} / ${result.totalOrders}", fontWeight = FontWeight.Bold, fontSize = 13.sp)
                }
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text("Total Revenue Synced:", fontSize = 13.sp)
                    Text("Rs. ${"%.2f".format(result.totalRevenue)}", fontWeight = FontWeight.Bold, color = Color(0xFF2E7D32), fontSize = 13.sp)
                }
                if (result.failedCount > 0) {
                    HorizontalDivider()
                    Text(
                        text = "⚠️ ${result.failedCount} bill(s) failed to upload and remain safely stored in offline mode.",
                        color = MaterialTheme.colorScheme.error,
                        fontSize = 12.sp
                    )
                }
            }
        },
        confirmButton = {
            Button(onClick = onDismiss) {
                Text("OK")
            }
        }
    )
}
