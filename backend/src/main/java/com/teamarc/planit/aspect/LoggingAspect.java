package com.teamarc.planit.aspect;

import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.*;

@Aspect
@Slf4j
public class LoggingAspect {

    @Before("execution(* com.teamarc.planit.services.*.*(..))")
    public void logBefore(JoinPoint joinPoint) {
    }

    @AfterReturning(pointcut = "execution(* com.teamarc.planit.services.*.*(..))", returning = "result")
    public void logAfterReturning(JoinPoint joinPoint, Object result) {
    }

    @AfterThrowing(pointcut = "execution(* com.teamarc.planit.services.*.*(..))", throwing = "error")
    public void logAfterThrowing(JoinPoint joinPoint, Throwable error) {
    }

    @Around("execution(* com.teamarc.planit.services.*.*(..))")
    public Object logExecutionTime(ProceedingJoinPoint joinPoint) throws Throwable {
        return joinPoint.proceed();
    }
}

