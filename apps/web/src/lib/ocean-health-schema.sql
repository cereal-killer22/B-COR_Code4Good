-- Ocean Health Database Schema
-- SDG 14 (Life Below Water) tables for ClimaGuard

-- Ocean Health Metrics Table
CREATE TABLE IF NOT EXISTS ocean_health_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  location POINT NOT NULL,
  timestamp TIMESTAMP DEFAULT NOW(),
  
  -- Water Quality
  ph DECIMAL(4,2),
  temperature DECIMAL(5,2),
  salinity DECIMAL(5,2),
  dissolved_oxygen DECIMAL(5,2),
  turbidity DECIMAL(5,2),
  water_quality_score INTEGER,
  
  -- Pollution
  plastic_density DECIMAL(10,2),
  oil_spill_risk INTEGER,
  chemical_pollution INTEGER,
  pollution_index INTEGER,
  
  -- Biodiversity
  species_count INTEGER,
  endangered_species INTEGER,
  biodiversity_index INTEGER,
  
  -- Reef Health
  bleaching_risk VARCHAR(20),
  reef_health_index INTEGER,
  coral_coverage DECIMAL(5,2),
  
  -- Overall
  overall_health_score INTEGER,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index on location for spatial queries
CREATE INDEX IF NOT EXISTS idx_ocean_health_location ON ocean_health_metrics USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_ocean_health_timestamp ON ocean_health_metrics(timestamp DESC);

-- Pollution Events Table
CREATE TABLE IF NOT EXISTS pollution_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type VARCHAR(50) NOT NULL CHECK (type IN ('oil_spill', 'plastic', 'chemical', 'debris', 'sewage')),
  location POINT NOT NULL,
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  detected_at TIMESTAMP NOT NULL,
  affected_area DECIMAL(10,2),
  status VARCHAR(20) DEFAULT 'detected' CHECK (status IN ('detected', 'confirmed', 'contained', 'resolved')),
  source TEXT,
  predicted_spread JSONB,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_pollution_location ON pollution_events USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_pollution_type ON pollution_events(type);
CREATE INDEX IF NOT EXISTS idx_pollution_status ON pollution_events(status);
CREATE INDEX IF NOT EXISTS idx_pollution_detected_at ON pollution_events(detected_at DESC);

-- Coral Reef Monitoring Table
CREATE TABLE IF NOT EXISTS coral_reef_monitoring (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reef_id VARCHAR(100) UNIQUE NOT NULL,
  location POINT NOT NULL,
  name VARCHAR(255),
  health_index INTEGER,
  bleaching_risk VARCHAR(20) CHECK (bleaching_risk IN ('low', 'medium', 'high', 'severe')),
  temperature DECIMAL(5,2),
  ph DECIMAL(4,2),
  biodiversity INTEGER,
  coral_coverage DECIMAL(5,2),
  last_assessment TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_reef_location ON coral_reef_monitoring USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_reef_bleaching_risk ON coral_reef_monitoring(bleaching_risk);
CREATE INDEX IF NOT EXISTS idx_reef_health_index ON coral_reef_monitoring(health_index);

-- Biodiversity Metrics Table
CREATE TABLE IF NOT EXISTS biodiversity_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  location POINT NOT NULL,
  timestamp TIMESTAMP DEFAULT NOW(),
  species_count INTEGER,
  endangered_species INTEGER,
  biodiversity_index INTEGER,
  species_list JSONB,
  habitat_health JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_biodiversity_location ON biodiversity_metrics USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_biodiversity_timestamp ON biodiversity_metrics(timestamp DESC);

-- Ocean Acidification Metrics Table
CREATE TABLE IF NOT EXISTS acidification_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  location POINT NOT NULL,
  timestamp TIMESTAMP DEFAULT NOW(),
  ph DECIMAL(4,2) NOT NULL,
  ph_anomaly DECIMAL(4,2),
  aragonite_saturation DECIMAL(5,2),
  co2_concentration DECIMAL(6,2),
  trend VARCHAR(20) CHECK (trend IN ('improving', 'stable', 'declining')),
  projected_ph JSONB,
  impact_level VARCHAR(20) CHECK (impact_level IN ('low', 'medium', 'high', 'critical')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_acidification_location ON acidification_metrics USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_acidification_timestamp ON acidification_metrics(timestamp DESC);

-- Sustainable Fishing Metrics Table
CREATE TABLE IF NOT EXISTS sustainable_fishing_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  location POINT NOT NULL,
  timestamp TIMESTAMP DEFAULT NOW(),
  vessel_count INTEGER,
  total_catch DECIMAL(10,2),
  sustainable_catch DECIMAL(10,2),
  overfishing_risk INTEGER,
  stock_status JSONB,
  protected_area_compliance JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_fishing_location ON sustainable_fishing_metrics USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_fishing_timestamp ON sustainable_fishing_metrics(timestamp DESC);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to auto-update updated_at
CREATE TRIGGER update_ocean_health_updated_at BEFORE UPDATE ON ocean_health_metrics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pollution_events_updated_at BEFORE UPDATE ON pollution_events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_coral_reef_updated_at BEFORE UPDATE ON coral_reef_monitoring
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_biodiversity_updated_at BEFORE UPDATE ON biodiversity_metrics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_acidification_updated_at BEFORE UPDATE ON acidification_metrics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fishing_updated_at BEFORE UPDATE ON sustainable_fishing_metrics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

