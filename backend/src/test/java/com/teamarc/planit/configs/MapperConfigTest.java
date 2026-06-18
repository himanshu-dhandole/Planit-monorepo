package com.teamarc.planit.configs;

import com.teamarc.planit.dto.PointDTO;
import com.teamarc.planit.dto.request.OnBoardNewVendorRequestDTO;
import com.teamarc.planit.dto.response.BookingResponseDTO;
import com.teamarc.planit.dto.response.ServiceResponseDTO;
import com.teamarc.planit.entity.*;
import com.teamarc.planit.entity.enums.BookingStatus;
import com.teamarc.planit.entity.enums.VendorServiceCategory;
import org.junit.jupiter.api.Test;
import org.locationtech.jts.geom.Point;
import org.modelmapper.ModelMapper;

import static org.junit.jupiter.api.Assertions.*;

class MapperConfigTest {

    @Test
    void testPointToPointDTOMapping() {
        ModelMapper mapper = MapperConfig.modelMapper();

        // 1. Test non-null Point mapping via container
        Point point = com.teamarc.planit.utils.GeometryUtil.creatPoint(new PointDTO(new double[]{12.34, 56.78}));
        OnBoardNewVendorRequest request = OnBoardNewVendorRequest.builder()
                .id(1L)
                .businessName("Test Business")
                .category(VendorServiceCategory.DECORATION)
                .coordinates(point)
                .build();

        OnBoardNewVendorRequestDTO dto = mapper.map(request, OnBoardNewVendorRequestDTO.class);
        assertNotNull(dto);
        assertNotNull(dto.getCoordinates());
        assertArrayEquals(new double[]{12.34, 56.78}, dto.getCoordinates().getCoordinates());

        // 2. Test null Point mapping via container
        OnBoardNewVendorRequest requestWithNull = OnBoardNewVendorRequest.builder()
                .id(2L)
                .businessName("Test Null Coordinates")
                .category(VendorServiceCategory.CATERING)
                .coordinates(null)
                .build();

        OnBoardNewVendorRequestDTO dtoWithNull = mapper.map(requestWithNull, OnBoardNewVendorRequestDTO.class);
        assertNotNull(dtoWithNull);
        assertNull(dtoWithNull.getCoordinates());
    }

    @Test
    void testPointDTOToPointMapping() {
        ModelMapper mapper = MapperConfig.modelMapper();

        // 1. Test non-null PointDTO mapping via container
        PointDTO pointDTO = new PointDTO(new double[]{12.34, 56.78});
        OnBoardNewVendorRequestDTO dto = new OnBoardNewVendorRequestDTO();
        dto.setId(1L);
        dto.setBusinessName("Test Business");
        dto.setCategory("DECORATION");
        dto.setCoordinates(pointDTO);

        OnBoardNewVendorRequest request = mapper.map(dto, OnBoardNewVendorRequest.class);
        assertNotNull(request);
        assertNotNull(request.getCoordinates());
        assertEquals(12.34, request.getCoordinates().getX());
        assertEquals(56.78, request.getCoordinates().getY());

        // 2. Test null PointDTO mapping via container
        OnBoardNewVendorRequestDTO dtoWithNull = new OnBoardNewVendorRequestDTO();
        dtoWithNull.setId(2L);
        dtoWithNull.setBusinessName("Test Null Coordinates");
        dtoWithNull.setCategory("CATERING");
        dtoWithNull.setCoordinates(null);

        OnBoardNewVendorRequest requestWithNull = mapper.map(dtoWithNull, OnBoardNewVendorRequest.class);
        assertNotNull(requestWithNull);
        assertNull(requestWithNull.getCoordinates());
    }

    @Test
    void testBookingToBookingResponseDTO() {
        ModelMapper mapper = MapperConfig.modelMapper();

        Event event = new Event();
        event.setId(10L);

        User user = new User();
        user.setEmail("john.doe@example.com");

        Customer customer = new Customer();
        customer.setId(20L);
        customer.setFirstName("John");
        customer.setLastName("Doe");
        customer.setPhoneNumber("9876543210");
        customer.setUser(user);

        Services service = new Services();
        service.setId(30L);
        service.setName("Photography Service");
        service.setCategory(VendorServiceCategory.PHOTOGRAPHY);
        service.setPrice(java.math.BigDecimal.valueOf(15000));

        Booking booking = new Booking();
        booking.setId(100L);
        booking.setEvent(event);
        booking.setCustomer(customer);
        booking.setServices(service);
        booking.setStatus(BookingStatus.CONFIRMED);
        booking.setBookingAmount(java.math.BigDecimal.valueOf(15000));
        booking.setStartDt(java.time.LocalDateTime.now());
        booking.setEndDt(java.time.LocalDateTime.now().plusHours(4));
        booking.setBookedAt(java.time.LocalDateTime.now());

        BookingResponseDTO dto = mapper.map(booking, BookingResponseDTO.class);

        assertNotNull(dto);
        assertEquals(100L, dto.getId());
        assertEquals(10L, dto.getEventId());
        assertEquals(20L, dto.getCustomerId());
        assertEquals(30L, dto.getServiceId());
        assertEquals("John Doe", dto.getClientName());
        assertEquals("john.doe@example.com", dto.getClientEmail());
        assertEquals("9876543210", dto.getClientPhone());
        assertNotNull(dto.getServices());
        assertEquals(30L, dto.getServices().getId());
        assertEquals("Photography Service", dto.getServices().getName());
        assertEquals("PHOTOGRAPHY", dto.getServices().getCategory());
    }
}

