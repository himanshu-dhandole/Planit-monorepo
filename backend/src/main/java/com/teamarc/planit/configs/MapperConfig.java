package com.teamarc.planit.configs;

import com.teamarc.planit.dto.PointDTO;
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
            return GeometryUtil.creatPoint(pointDTO);
        });

        mapper.typeMap(Point.class, PointDTO.class).setConverter(context ->{
            Point point = context.getSource();
            double[] coordiantes={
                    point.getX(),
                    point.getY()
            };
            return new PointDTO(coordiantes);
        });
        return mapper;
    }
}