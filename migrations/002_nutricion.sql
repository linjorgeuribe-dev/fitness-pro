-- Nuevos tipos sincronizables: registro diario (nutrición, agua, sueño) y medidas corporales.
alter table records drop constraint if exists records_kind_check;
alter table records add constraint records_kind_check check (kind in ('profile','routine','session','body','day','measure'));
