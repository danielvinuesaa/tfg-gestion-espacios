package com.tfg.backend.config;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.core.task.SyncTaskExecutor;
import java.util.concurrent.Executor;

@TestConfiguration
public class TestAsyncConfig {
    @Bean
    @Primary
    public Executor applicationTaskExecutor() {
        return new SyncTaskExecutor();
    }
}
