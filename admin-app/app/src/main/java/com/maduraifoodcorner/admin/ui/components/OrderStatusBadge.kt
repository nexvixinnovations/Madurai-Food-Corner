package com.maduraifoodcorner.admin.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.maduraifoodcorner.admin.ui.theme.*

@Composable
fun OrderStatusBadge(status: String) {
    val (bgColor, textColor) = when (status.lowercase()) {
        "pending" -> StatusPending to Color.White
        "accepted" -> StatusAccepted to Color.White
        "preparing" -> StatusPreparing to Color.White
        "ready" -> StatusReady to Color.White
        "completed" -> StatusCompleted to Color.White
        "cancelled" -> StatusCancelled to Color.White
        else -> Color.Gray to Color.White
    }

    Text(
        text = status,
        color = textColor,
        fontSize = 11.sp,
        fontWeight = FontWeight.Bold,
        modifier = Modifier
            .background(bgColor, shape = RoundedCornerShape(12.dp))
            .padding(horizontal = 10.dp, vertical = 4.dp)
    )
}
