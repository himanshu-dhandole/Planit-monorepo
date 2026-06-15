package com.teamarc.planit.configs;

import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    // Queue Names
    public static final String OTP_EMAIL_QUEUE = "otp.email.queue";
    public static final String USER_NOTIFICATION_QUEUE = "user.notification.queue";
    public static final String VENDOR_APPROVAL_QUEUE = "vendor.approval.queue";

    // Exchange Names
    public static final String EMAIL_EXCHANGE = "email.exchange";
    public static final String NOTIFICATION_EXCHANGE = "notification.exchange";

    // Routing Keys
    public static final String OTP_EMAIL_ROUTING_KEY = "email.otp";
    public static final String USER_NOTIFICATION_ROUTING_KEY = "notification.user";
    public static final String VENDOR_APPROVAL_ROUTING_KEY = "notification.vendor.approval";

    // Declare Queues
    @Bean
    public Queue otpEmailQueue() {
        return new Queue(OTP_EMAIL_QUEUE, true);
    }

    @Bean
    public Queue userNotificationQueue() {
        return new Queue(USER_NOTIFICATION_QUEUE, true);
    }

    @Bean
    public Queue vendorApprovalQueue() {
        return new Queue(VENDOR_APPROVAL_QUEUE, true);
    }

    // Declare Exchanges
    @Bean
    public TopicExchange emailExchange() {
        return new TopicExchange(EMAIL_EXCHANGE, true, false);
    }

    @Bean
    public TopicExchange notificationExchange() {
        return new TopicExchange(NOTIFICATION_EXCHANGE, true, false);
    }

    // Bindings
    @Bean
    public Binding otpEmailBinding(Queue otpEmailQueue, TopicExchange emailExchange) {
        return BindingBuilder.bind(otpEmailQueue)
                .to(emailExchange)
                .with(OTP_EMAIL_ROUTING_KEY);
    }

    @Bean
    public Binding userNotificationBinding(Queue userNotificationQueue, TopicExchange notificationExchange) {
        return BindingBuilder.bind(userNotificationQueue)
                .to(notificationExchange)
                .with(USER_NOTIFICATION_ROUTING_KEY);
    }

    @Bean
    public Binding vendorApprovalBinding(Queue vendorApprovalQueue, TopicExchange notificationExchange) {
        return BindingBuilder.bind(vendorApprovalQueue)
                .to(notificationExchange)
                .with(VENDOR_APPROVAL_ROUTING_KEY);
    }

    // Message Converter
    @Bean
    public MessageConverter messageConverter() {
        return new Jackson2JsonMessageConverter();
    }

    // RabbitTemplate
    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory) {
        RabbitTemplate rabbitTemplate = new RabbitTemplate(connectionFactory);
        rabbitTemplate.setMessageConverter(messageConverter());
        return rabbitTemplate;
    }
}
