import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.Statement;

public class DbDropTables {
    public static void main(String[] args) {
        try {
            Connection conn = DriverManager.getConnection("jdbc:postgresql://localhost:5432/hyhub", "hyhub_app", "hyhub_app");
            Statement stmt = conn.createStatement();
            
            stmt.execute("DROP TABLE IF EXISTS notification_templates;");
            
            stmt.close();
            conn.close();
            System.out.println("Finished dropping templates.");
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
