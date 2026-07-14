UPDATE facility_fields ff
SET field_options = (
    SELECT jsonb_agg(fo.option_value ORDER BY fo.display_order)
    FROM field_options fo
    WHERE fo.field_id = ff.field_id
)
WHERE EXISTS (
    SELECT 1 FROM field_options fo WHERE fo.field_id = ff.field_id
);
