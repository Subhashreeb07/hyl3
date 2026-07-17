import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;

public class DbCheck {
    public static void main(String[] args) {
        String dbUrl = System.getenv().getOrDefault("APP_DB_URL", "jdbc:postgresql://localhost:5432/hyhub");
        String dbUser = System.getenv().getOrDefault("APP_DB_USERNAME", "hyhub_app");
        String dbPassword = System.getenv().getOrDefault("APP_DB_PASSWORD", "");
        try {
            Connection conn = DriverManager.getConnection(dbUrl, dbUser, dbPassword);
            Statement stmt = conn.createStatement();
            ResultSet rs = stmt.executeQuery("SELECT table_name FROM information_schema.tables WHERE table_schema = 'hyhub_new'");
            System.out.println("--- TABLES IN HYHUB_NEW ---");
            while (rs.next()) {
                System.out.println(rs.getString("table_name"));
            }
            stmt.close();
            conn.close();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
