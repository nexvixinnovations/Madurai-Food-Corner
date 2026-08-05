package com.maduraifoodcorner.admin.data.printer

import android.content.Context
import com.maduraifoodcorner.admin.data.repository.PrintRepository
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object PrinterModule {

    @Provides
    @Singleton
    fun provideBluetoothPrinterManager(@ApplicationContext context: Context): BluetoothPrinterManager {
        return BluetoothPrinterManager(context)
    }

    @Provides
    @Singleton
    fun providePrintRepository(printerManager: BluetoothPrinterManager): PrintRepository {
        return PrintRepository(printerManager)
    }
}
