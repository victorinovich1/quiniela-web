-- =====================================================
-- 073 - Corrección: Contar solo partidos con resultados reales
-- =====================================================

-- El problema: PJ contaba todos los partidos del grupo sin importar si tienen scores
-- La solución: Solo contar partidos finished/live o scheduled con kickoff pasado Y scores no nulos

drop view if exists public.official_group_standings cascade;
drop view if exists public.official_best_thirds cascade;

create or replace view public.official_group_standings
with (security_invoker = true)
as
select
  t.id as team_id,
  t.name as team_name,
  t.group_code,
  t.iso_code,
  -- PJ: Solo contar si el partido tiene scores válidos
  count(case 
    when m.id is not null and (
      (m.status = 'finished' and m.home_score is not null and m.away_score is not null)
      or (m.status = 'live' and m.home_score is not null and m.away_score is not null)
      or (m.status = 'scheduled' and m.kickoff_at is not null and m.kickoff_at <= now() 
          and m.home_score is not null and m.away_score is not null)
    ) then 1 
  end) as pj,
  
  -- PG: Partidos ganados
  count(case 
    when m.home_team_id = t.id and (
      case 
        when m.status = 'finished' then m.home_score
        when m.status = 'live' and m.home_score is not null then m.home_score
        when m.status = 'scheduled' and m.kickoff_at is not null 
          and m.kickoff_at <= now() and m.home_score is not null then m.home_score
        else null
      end
    ) > (
      case 
        when m.status = 'finished' then m.away_score
        when m.status = 'live' and m.away_score is not null then m.away_score
        when m.status = 'scheduled' and m.kickoff_at is not null 
          and m.kickoff_at <= now() and m.away_score is not null then m.away_score
        else null
      end
    ) then 1
    when m.away_team_id = t.id and (
      case 
        when m.status = 'finished' then m.away_score
        when m.status = 'live' and m.away_score is not null then m.away_score
        when m.status = 'scheduled' and m.kickoff_at is not null 
          and m.kickoff_at <= now() and m.away_score is not null then m.away_score
        else null
      end
    ) > (
      case 
        when m.status = 'finished' then m.home_score
        when m.status = 'live' and m.home_score is not null then m.home_score
        when m.status = 'scheduled' and m.kickoff_at is not null 
          and m.kickoff_at <= now() and m.home_score is not null then m.home_score
        else null
      end
    ) then 1
  end) as pg,
  
  -- PE: Partidos empatados
  count(case 
    when (m.home_team_id = t.id or m.away_team_id = t.id) and (
      case 
        when m.status = 'finished' then m.home_score
        when m.status = 'live' and m.home_score is not null then m.home_score
        when m.status = 'scheduled' and m.kickoff_at is not null 
          and m.kickoff_at <= now() and m.home_score is not null then m.home_score
        else null
      end
    ) = (
      case 
        when m.status = 'finished' then m.away_score
        when m.status = 'live' and m.away_score is not null then m.away_score
        when m.status = 'scheduled' and m.kickoff_at is not null 
          and m.kickoff_at <= now() and m.away_score is not null then m.away_score
        else null
      end
    ) and (
      case 
        when m.status = 'finished' then m.home_score
        when m.status = 'live' and m.home_score is not null then m.home_score
        when m.status = 'scheduled' and m.kickoff_at is not null 
          and m.kickoff_at <= now() and m.home_score is not null then m.home_score
        else null
      end
    ) is not null then 1
  end) as pe,
  
  -- PP: Partidos perdidos
  count(case 
    when m.home_team_id = t.id and (
      case 
        when m.status = 'finished' then m.home_score
        when m.status = 'live' and m.home_score is not null then m.home_score
        when m.status = 'scheduled' and m.kickoff_at is not null 
          and m.kickoff_at <= now() and m.home_score is not null then m.home_score
        else null
      end
    ) < (
      case 
        when m.status = 'finished' then m.away_score
        when m.status = 'live' and m.away_score is not null then m.away_score
        when m.status = 'scheduled' and m.kickoff_at is not null 
          and m.kickoff_at <= now() and m.away_score is not null then m.away_score
        else null
      end
    ) then 1
    when m.away_team_id = t.id and (
      case 
        when m.status = 'finished' then m.away_score
        when m.status = 'live' and m.away_score is not null then m.away_score
        when m.status = 'scheduled' and m.kickoff_at is not null 
          and m.kickoff_at <= now() and m.away_score is not null then m.away_score
        else null
      end
    ) < (
      case 
        when m.status = 'finished' then m.home_score
        when m.status = 'live' and m.home_score is not null then m.home_score
        when m.status = 'scheduled' and m.kickoff_at is not null 
          and m.kickoff_at <= now() and m.home_score is not null then m.home_score
        else null
      end
    ) then 1
  end) as pp,
  
  -- GF: Goles a favor
  coalesce(sum(case 
    when m.home_team_id = t.id and (
      m.status = 'finished' 
      or (m.status = 'live' and m.home_score is not null)
      or (m.status = 'scheduled' and m.kickoff_at <= now() and m.home_score is not null)
    ) then coalesce(m.home_score, 0)
    when m.away_team_id = t.id and (
      m.status = 'finished'
      or (m.status = 'live' and m.away_score is not null)
      or (m.status = 'scheduled' and m.kickoff_at <= now() and m.away_score is not null)
    ) then coalesce(m.away_score, 0)
    else 0
  end), 0) as gf,
  
  -- GC: Goles en contra
  coalesce(sum(case 
    when m.home_team_id = t.id and (
      m.status = 'finished'
      or (m.status = 'live' and m.away_score is not null)
      or (m.status = 'scheduled' and m.kickoff_at <= now() and m.away_score is not null)
    ) then coalesce(m.away_score, 0)
    when m.away_team_id = t.id and (
      m.status = 'finished'
      or (m.status = 'live' and m.home_score is not null)
      or (m.status = 'scheduled' and m.kickoff_at <= now() and m.home_score is not null)
    ) then coalesce(m.home_score, 0)
    else 0
  end), 0) as gc,
  
  -- DG: Diferencia de goles (GF - GC)
  (
    coalesce(sum(case 
      when m.home_team_id = t.id and (
        m.status = 'finished' 
        or (m.status = 'live' and m.home_score is not null)
        or (m.status = 'scheduled' and m.kickoff_at <= now() and m.home_score is not null)
      ) then coalesce(m.home_score, 0)
      when m.away_team_id = t.id and (
        m.status = 'finished'
        or (m.status = 'live' and m.away_score is not null)
        or (m.status = 'scheduled' and m.kickoff_at <= now() and m.away_score is not null)
      ) then coalesce(m.away_score, 0)
      else 0
    end), 0) -
    coalesce(sum(case 
      when m.home_team_id = t.id and (
        m.status = 'finished'
        or (m.status = 'live' and m.away_score is not null)
        or (m.status = 'scheduled' and m.kickoff_at <= now() and m.away_score is not null)
      ) then coalesce(m.away_score, 0)
      when m.away_team_id = t.id and (
        m.status = 'finished'
        or (m.status = 'live' and m.home_score is not null)
        or (m.status = 'scheduled' and m.kickoff_at <= now() and m.home_score is not null)
      ) then coalesce(m.home_score, 0)
      else 0
    end), 0)
  ) as dg,
  
  -- PTS: Puntos (victorias * 3 + empates * 1)
  (
    count(case 
      when m.home_team_id = t.id and (
        case 
          when m.status = 'finished' then m.home_score
          when m.status = 'live' and m.home_score is not null then m.home_score
          when m.status = 'scheduled' and m.kickoff_at is not null 
            and m.kickoff_at <= now() and m.home_score is not null then m.home_score
          else null
        end
      ) > (
        case 
          when m.status = 'finished' then m.away_score
          when m.status = 'live' and m.away_score is not null then m.away_score
          when m.status = 'scheduled' and m.kickoff_at is not null 
            and m.kickoff_at <= now() and m.away_score is not null then m.away_score
          else null
        end
      ) then 1
      when m.away_team_id = t.id and (
        case 
          when m.status = 'finished' then m.away_score
          when m.status = 'live' and m.away_score is not null then m.away_score
          when m.status = 'scheduled' and m.kickoff_at is not null 
            and m.kickoff_at <= now() and m.away_score is not null then m.away_score
          else null
        end
      ) > (
        case 
          when m.status = 'finished' then m.home_score
          when m.status = 'live' and m.home_score is not null then m.home_score
          when m.status = 'scheduled' and m.kickoff_at is not null 
            and m.kickoff_at <= now() and m.home_score is not null then m.home_score
          else null
        end
      ) then 1
    end) * 3 +
    count(case 
      when (m.home_team_id = t.id or m.away_team_id = t.id) and (
        case 
          when m.status = 'finished' then m.home_score
          when m.status = 'live' and m.home_score is not null then m.home_score
          when m.status = 'scheduled' and m.kickoff_at is not null 
            and m.kickoff_at <= now() and m.home_score is not null then m.home_score
          else null
        end
      ) = (
        case 
          when m.status = 'finished' then m.away_score
          when m.status = 'live' and m.away_score is not null then m.away_score
          when m.status = 'scheduled' and m.kickoff_at is not null 
            and m.kickoff_at <= now() and m.away_score is not null then m.away_score
          else null
        end
      ) and (
        case 
          when m.status = 'finished' then m.home_score
          when m.status = 'live' and m.home_score is not null then m.home_score
          when m.status = 'scheduled' and m.kickoff_at is not null 
            and m.kickoff_at <= now() and m.home_score is not null then m.home_score
          else null
        end
      ) is not null then 1
    end)
  ) as pts
from public.teams t
left join public.matches m on (
  m.phase = 'group' 
  and m.group_code = t.group_code
  and (m.home_team_id = t.id or m.away_team_id = t.id)
)
where t.group_code is not null
group by t.id, t.name, t.group_code, t.iso_code
order by t.group_code, pts desc, dg desc, gf desc, t.name;

grant select on public.official_group_standings to authenticated, anon;

-- Recrear official_best_thirds
create or replace view public.official_best_thirds
with (security_invoker = true)
as
with group_positions as (
  select
    *,
    row_number() over (partition by group_code order by pts desc, dg desc, gf desc, team_name) as position
  from public.official_group_standings
)
select
  team_id,
  team_name,
  group_code,
  iso_code,
  pj,
  pg,
  pe,
  pp,
  gf,
  gc,
  dg,
  pts,
  row_number() over (order by pts desc, dg desc, gf desc, team_name) as third_place_rank
from group_positions
where position = 3
order by pts desc, dg desc, gf desc, team_name;

grant select on public.official_best_thirds to authenticated, anon;

-- LOG: Confirmar cambios
do $$
begin
  raise notice '✅ Lógica de posiciones oficiales corregida:';
  raise notice '   - PJ ahora solo cuenta partidos con scores válidos';
  raise notice '   - Filtro: finished, live con scores, o scheduled+kickoff pasado+scores';
end $$;
