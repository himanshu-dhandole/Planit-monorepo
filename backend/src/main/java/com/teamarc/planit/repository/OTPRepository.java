package com.teamarc.planit.repository;

import com.teamarc.planit.entity.OTP;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface OTPRepository extends JpaRepository<OTP, Long> {

    /**
     * Find valid (non-used, non-expired) OTP by email and type
     * Returns the latest OTP first (no LIMIT in JPQL, use List and get(0))
     */
    @Query("SELECT o FROM OTP o WHERE o.email = :email AND o.type = :type AND o.isUsed = false AND o.expiryTime > :now ORDER BY o.createdAt DESC")
    List<OTP> findValidOTPByEmailAndType(@Param("email") String email, 
                                         @Param("type") OTP.OTPType type,
                                         @Param("now") LocalDateTime now);

    /**
     * Find latest valid OTP for a specific user and type
     */
    @Query("SELECT o FROM OTP o WHERE o.user.id = :userId AND o.type = :type AND o.isUsed = false ORDER BY o.createdAt DESC")
    List<OTP> findLatestValidOTPForUser(@Param("userId") Long userId, 
                                        @Param("type") OTP.OTPType type);

    /**
     * Find latest valid OTP for email
     */
    @Query("SELECT o FROM OTP o WHERE o.email = :email AND o.type = :type AND o.isUsed = false ORDER BY o.createdAt DESC")
    List<OTP> findLatestValidOTPForEmail(@Param("email") String email, 
                                         @Param("type") OTP.OTPType type);

    /**
     * Delete expired OTPs
     */
    void deleteByExpiryTimeBefore(LocalDateTime dateTime);

    /**
     * Delete all OTPs for a specific user and type
     */
    void deleteByUserIdAndType(Long userId, OTP.OTPType type);
}
