import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.Statement;

public class DbNewSchema {
    public static void main(String[] args) {
        String dbUrl = System.getenv().getOrDefault("APP_DB_URL", "jdbc:postgresql://localhost:5432/hyhub");
        String dbUser = System.getenv().getOrDefault("APP_DB_USERNAME", "hyhub_app");
        String dbPassword = System.getenv().getOrDefault("APP_DB_PASSWORD", "");
        try {
            Connection conn = DriverManager.getConnection(dbUrl, dbUser, dbPassword);
            Statement stmt = conn.createStatement();
            stmt.executeUpdate("CREATE SCHEMA IF NOT EXISTS hyhub_v2");
            System.out.println("SUCCESS creating schema hyhub_v2");
            stmt.close();
            conn.close();
        } catch (Exception e) {
            System.out.println("FAILED to create schema hyhub_v2: " + e.getMessage());
        }
    }
}
