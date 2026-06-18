package com.teamarc.planit.configs;

import com.teamarc.planit.dto.PointDTO;
import com.teamarc.planit.dto.response.BookingResponseDTO;
import com.teamarc.planit.entity.Booking;
import com.teamarc.planit.utils.GeometryUtil;
import org.modelmapper.ModelMapper;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import org.locationtech.jts.geom.Point;

@Configuration
public class MapperConfig {

    @Bean
    public static ModelMapper modelMapper(){
        ModelMapper mapper= new ModelMapper();

        mapper.typeMap(PointDTO.class, Point.class).setConverter(context -> {
            PointDTO pointDTO= context.getSource();
            if (pointDTO == null) {
                return null;
            }
            return GeometryUtil.creatPoint(pointDTO);
        });

        mapper.typeMap(Point.class, PointDTO.class).setConverter(context ->{
            Point point = context.getSource();
            if (point == null) {
                return null;
            }
            double[] coordiantes={
                    point.getX(),
                    point.getY()
            };
            return new PointDTO(coordiantes);
        });

        mapper.typeMap(Booking.class, BookingResponseDTO.class).addMappings(m -> {
            m.map(src -> src.getServices().getId(), BookingResponseDTO::setServiceId);
        }).setPostConverter(context -> {
            Booking src = context.getSource();
            BookingResponseDTO dest = context.getDestination();
            if (src != null && dest != null) {
                if (src.getCustomer() != null) {
                    dest.setClientName(src.getCustomer().getFirstName() + " " + src.getCustomer().getLastName());
                    dest.setClientPhone(src.getCustomer().getPhoneNumber());
                    if (src.getCustomer().getUser() != null) {
                        dest.setClientEmail(src.getCustomer().getUser().getEmail());
                    }
                }
            }
            return dest;
        });

        return mapper;
    }
}