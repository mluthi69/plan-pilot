-- Trigger function: when an agreement's date range or period length changes,
-- re-fire the existing per-category regenerator by "touching" each category row.
CREATE OR REPLACE FUNCTION public.cascade_regenerate_periods_on_agreement()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE'
     AND NEW.start_date IS NOT DISTINCT FROM OLD.start_date
     AND NEW.end_date   IS NOT DISTINCT FROM OLD.end_date
     AND NEW.period_length_months IS NOT DISTINCT FROM OLD.period_length_months
  THEN
    RETURN NEW;
  END IF;

  -- Bumping updated_at on each category fires the existing
  -- regenerate_funding_periods() trigger (AFTER INSERT/UPDATE OF total_amount).
  -- We update total_amount to itself so the trigger condition matches.
  UPDATE public.funding_agreement_categories
     SET total_amount = total_amount,
         updated_at   = now()
   WHERE agreement_id = NEW.id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_cascade_periods_on_agreement ON public.funding_agreements;
CREATE TRIGGER trg_cascade_periods_on_agreement
AFTER UPDATE ON public.funding_agreements
FOR EACH ROW
EXECUTE FUNCTION public.cascade_regenerate_periods_on_agreement();

-- Ensure the per-category trigger exists (it was implied but not visible in db-triggers).
DROP TRIGGER IF EXISTS trg_regenerate_funding_periods ON public.funding_agreement_categories;
CREATE TRIGGER trg_regenerate_funding_periods
AFTER INSERT OR UPDATE OF total_amount ON public.funding_agreement_categories
FOR EACH ROW
EXECUTE FUNCTION public.regenerate_funding_periods();